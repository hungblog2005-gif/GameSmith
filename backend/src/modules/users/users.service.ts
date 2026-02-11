import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

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

      return await this.userModel.create({
        username: dto.username,
        email: dto.email,
        password_hash: dto.password,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        const duplicated = error?.keyPattern
          ? Object.keys(error.keyPattern).join(', ')
          : 'email or username';
        throw new ConflictException(`Duplicate ${duplicated}`);
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

  updateProfile(id: string, dto: UpdateUserProfileDto) {
    return this.userModel
      .findByIdAndUpdate(id, { ...dto }, { new: true })
      .exec();
  }

  updateProfileByUsername(username: string, dto: UpdateUserProfileDto) {
    return this.userModel
      .findOneAndUpdate({ username }, { ...dto }, { new: true })
      .exec();
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
