import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Error as MongooseError } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { User, UserDocument } from './schemas/users.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto) {
    try {
      const existing = await this.userModel
        .findOne({ $or: [{ email: dto.email }, { username: dto.username }] })
        .exec();

      if (existing) {
        throw new ConflictException('Email or username already exists');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      return await this.userModel.create({
        username: dto.username,
        email: dto.email,
        password_hash: hashedPassword,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        const duplicated = error?.keyPattern
          ? Object.keys(error.keyPattern).join(', ')
          : 'email or username';
        throw new ConflictException(`Duplicate ${duplicated}`);
      }
      if (error instanceof MongooseError.ValidationError) {
        const messages = Object.values(error.errors).map((e: any) => e.message);
        throw new BadRequestException(messages.join(', '));
      }
      throw error;
    }
  }

  findAll() {
    return this.userModel.find().exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  updateAvatar(id: string, avatarUrl: string) {
    return this.userModel
      .findByIdAndUpdate(id, { avatar_url: avatarUrl }, { new: true })
      .exec();
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmailForLogin(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('+password_hash')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async changePassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new Error('INVALID_CURRENT_PASSWORD');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userModel
      .findByIdAndUpdate(user._id, { password_hash: hashed })
      .exec();
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await this.userModel
      .findByIdAndUpdate(userId, { refresh_token_hash: hash })
      .exec();
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { $unset: { refresh_token_hash: 1 } })
      .exec();
  }

  async findByIdAndValidateRefreshToken(
    userId: string,
    token: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel
      .findById(userId)
      .select('+refresh_token_hash')
      .exec();
    if (!user?.refresh_token_hash) return null;
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expectedBuf = Buffer.from(user.refresh_token_hash, 'hex');
    const receivedBuf = Buffer.from(hash, 'hex');
    if (expectedBuf.length !== receivedBuf.length) return null;
    try {
      return crypto.timingSafeEqual(expectedBuf, receivedBuf) ? user : null;
    } catch {
      return null;
    }
  }

  // ─── Download / Purchase helpers ─────────────────────────────────────────

  /**
   * Check whether a user has purchased a specific asset.
   * Uses the denormalized `purchased_assets` array for O(1) indexed lookup.
   */
  async hasPurchased(userId: string, assetId: string): Promise<boolean> {
    const hit = await this.userModel.exists({
      _id: new Types.ObjectId(userId),
      purchased_assets: new Types.ObjectId(assetId),
    });
    return !!hit;
  }

  /**
   * Return the paginated list of assets a user has purchased.
   * Only returns published assets so pulled/hidden assets are excluded.
   */
  async getPurchasedAssets(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'purchased_assets',
        match: { status: 'published' },
        select:
          'title slug thumbnailUrl price isFree fileFormat fileSize version stats licenseType categoryId',
        options: { skip, limit },
        populate: { path: 'categoryId', select: 'name slug' },
      })
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return {
      assets: user.purchased_assets ?? [],
      page,
      limit,
    };
  }

  /**
   * Atomically add an array of assetIds to the user's purchased_assets set.
   * Called when an order is marked completed + paid.
   * `$addToSet` is idempotent — safe to call multiple times.
   */
  async addPurchasedAssets(
    userId: Types.ObjectId | string,
    assetIds: Types.ObjectId[],
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $addToSet: { purchased_assets: { $each: assetIds } },
      })
      .exec();
  }

  /**
   * Remove an asset from the user's purchased_assets set (used on refund).
   */
  async removePurchasedAsset(userId: string, assetId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $pull: { purchased_assets: new Types.ObjectId(assetId) },
      })
      .exec();
  }
}
