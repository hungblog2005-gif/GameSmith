import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserCollection,
  UserCollectionDocument,
} from './schemas/user-collection.schema';
import { CreateUserCollectionDto } from './dto/create-user-collection.dto';

@Injectable()
export class UserCollectionsService {
  constructor(
    @InjectModel(UserCollection.name)
    private readonly userCollectionModel: Model<UserCollectionDocument>,
  ) {}

  /**
   * Create a new named collection for the user
   */
  async create(userId: string, dto: { name: string; description?: string; isPublic?: boolean }) {
    return this.userCollectionModel.create({
      userId: new Types.ObjectId(userId),
      name: dto.name,
      description: dto.description || '',
      isPublic: dto.isPublic || false,
      assets: [],
    });
  }

  /**
   * Add asset to collection
   */
  async addAsset(collectionId: string, assetId: string) {
    return this.userCollectionModel.findByIdAndUpdate(
      collectionId,
      { $addToSet: { assets: new Types.ObjectId(assetId) } },
      { new: true },
    ).populate('assets');
  }

  /**
   * Remove asset from collection
   */
  async removeAsset(collectionId: string, assetId: string) {
    return this.userCollectionModel.findByIdAndUpdate(
      collectionId,
      { $pull: { assets: new Types.ObjectId(assetId) } },
      { new: true },
    ).populate('assets');
  }

  /**
   * Get all collections for a user
   */
  findByUser(userId: string) {
    return this.userCollectionModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('assets')
      .exec();
  }

  /**
   * Get public collections
   */
  findPublic(limit = 10) {
    return this.userCollectionModel
      .find({ isPublic: true })
      .populate('userId', 'username avatarUrl')
      .populate('assets')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get collection by ID
   */
  findById(id: string) {
    return this.userCollectionModel
      .findById(id)
      .populate('assets')
      .exec();
  }

  /**
   * Update collection
   */
  update(id: string, dto: { name?: string; description?: string; isPublic?: boolean; thumbnailUrl?: string }) {
    const updates: any = {};
    if (dto.name) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.isPublic !== undefined) updates.isPublic = dto.isPublic;
    if (dto.thumbnailUrl !== undefined) updates.thumbnailUrl = dto.thumbnailUrl;

    return this.userCollectionModel.findByIdAndUpdate(id, updates, { new: true }).populate('assets');
  }

  /**
   * Delete collection
   */
  delete(id: string) {
    return this.userCollectionModel.findByIdAndDelete(id);
  }
}
