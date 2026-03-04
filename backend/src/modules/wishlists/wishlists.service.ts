import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

@Injectable()
export class WishlistsService {
  private readonly logger = new Logger(WishlistsService.name);

  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<WishlistDocument>,
  ) {}

  /** Validate if a string is a valid MongoDB ObjectId */
  private isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  /** Get all wishlist items for a user */
  async findByUser(userId: string) {
    try {
      if (!this.isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      return this.wishlistModel
        .find({ userId: new Types.ObjectId(userId) })
        .populate('assetId')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Error finding wishlist for user ${userId}:`, error);
      throw error;
    }
  }

  /** Toggle an asset in the wishlist. Returns { added: boolean } */
  async toggle(userId: string, assetId: string) {
    try {
      if (!this.isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      if (!this.isValidObjectId(assetId)) {
        throw new BadRequestException('Invalid asset ID format');
      }

      const userOid = new Types.ObjectId(userId);
      const assetOid = new Types.ObjectId(assetId);

      // Check if asset already in wishlist
      const existing = await this.wishlistModel.findOne({
        userId: userOid,
        assetId: assetOid,
      });

      if (existing) {
        // Remove it
        await this.wishlistModel.deleteOne({
          userId: userOid,
          assetId: assetOid,
        });
        return { added: false };
      } else {
        // Add it
        await this.wishlistModel.create({
          userId: userOid,
          assetId: assetOid,
        });
        return { added: true };
      }
    } catch (error) {
      this.logger.error(`Error toggling wishlist for user ${userId}, asset ${assetId}:`, error);
      throw error;
    }
  }

  /** Remove a specific asset from the wishlist */
  async removeAsset(userId: string, assetId: string) {
    try {
      if (!this.isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      if (!this.isValidObjectId(assetId)) {
        throw new BadRequestException('Invalid asset ID format');
      }

      await this.wishlistModel.deleteOne({
        userId: new Types.ObjectId(userId),
        assetId: new Types.ObjectId(assetId),
      });
      return { removed: true };
    } catch (error) {
      this.logger.error(`Error removing asset from wishlist:`, error);
      throw error;
    }
  }

  /** Check if an asset is in user's wishlist */
  async isInWishlist(userId: string, assetId: string): Promise<boolean> {
    try {
      if (!this.isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      if (!this.isValidObjectId(assetId)) {
        throw new BadRequestException('Invalid asset ID format');
      }

      const item = await this.wishlistModel.findOne({
        userId: new Types.ObjectId(userId),
        assetId: new Types.ObjectId(assetId),
      });
      return !!item;
    } catch (error) {
      this.logger.error(`Error checking wishlist:`, error);
      throw error;
    }
  }

  /** Add asset to wishlist */
  async addAsset(userId: string, assetId: string) {
    try {
      if (!this.isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      if (!this.isValidObjectId(assetId)) {
        throw new BadRequestException('Invalid asset ID format');
      }

      return this.wishlistModel.create({
        userId: new Types.ObjectId(userId),
        assetId: new Types.ObjectId(assetId),
      });
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key - asset already in wishlist
        return this.wishlistModel.findOne({
          userId: new Types.ObjectId(userId),
          assetId: new Types.ObjectId(assetId),
        });
      }
      throw error;
    }
  }

  /** Clear all wishlist items for a user */
  async clearUser(userId: string): Promise<any> {
    try {
      if (!this.isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      return this.wishlistModel.deleteMany({
        userId: new Types.ObjectId(userId),
      });
    } catch (error) {
      this.logger.error(`Error clearing wishlist for user ${userId}:`, error);
      throw error;
    }
  }
}
