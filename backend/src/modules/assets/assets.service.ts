import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Asset, AssetDocument } from './schemas/asset.schema';
import { CreateAssetDto } from './dto/create-asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
  ) {}

  async create(dto: CreateAssetDto) {
    try {
      return await this.assetModel.create({
        title: dto.title,
        description: dto.description || '',
        shortDescription: dto.description || '',
        price: dto.price,
        discountPercent: dto.discount_percentage || 0,
        isFree: dto.is_free || false,
        categoryId: new Types.ObjectId(dto.categoryId),
        creatorId: new Types.ObjectId(dto.creatorId),
        thumbnailUrl: dto.thumbnail_url || '',
        previewImages: dto.preview_images || [],
        slug: dto.slug || '',
        status: dto.status || 'draft',
        tags: dto.tags || [],
        fileFormat: dto.file_format || [],
        fileSize: dto.file_size || '',
        gameEngineSupport: dto.game_engine_support || [],
        licenseType: dto.license_type || 'personal',
        polygonCount: dto.polygon_count || 0,
        textureResolution: dto.texture_resolution || '',
        animated: dto.animated || false,
        rigged: dto.rigged || false,
        featured: dto.featured || false,
      });
    } catch (error) {
      console.error('Asset creation error:', error);
      throw error;
    }
  }

  findAll(filters?: { status?: string }) {
    const query: Record<string, any> = {};
    if (filters?.status) {
      query.status = filters.status;
    }
    return this.assetModel
      .find(query)
      .populate(['categoryId', 'creatorId'])
      .sort({ createdAt: -1 })
      .exec();
  }

  async findFeatured(limit = 6) {
    let assets = await this.assetModel
      .find({ featured: true })
      .populate(['categoryId', 'creatorId'])
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    // Fallback: if no featured assets, return latest assets
    if (assets.length === 0) {
      assets = await this.assetModel
        .find()
        .populate(['categoryId', 'creatorId'])
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    }

    return assets;
  }

  findByCategory(categoryId: string) {
    return this.assetModel
      .find({ categoryId: new Types.ObjectId(categoryId) })
      .populate(['categoryId', 'creatorId'])
      .exec();
  }

  findByCreator(creatorId: string) {
    return this.assetModel
      .find({ creatorId: new Types.ObjectId(creatorId) })
      .populate(['categoryId', 'creatorId'])
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, creatorId: string, dto: Partial<CreateAssetDto>) {
    const asset = await this.assetModel.findById(id);
    if (!asset) return null;
    if (asset.creatorId.toString() !== creatorId) return null;

    const updateData: Record<string, any> = { ...dto };
    if (dto.categoryId) {
      updateData.categoryId = new Types.ObjectId(dto.categoryId);
      delete updateData.categoryId;
    }
    delete updateData.creatorId;

    return this.assetModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate(['categoryId', 'creatorId'])
      .exec();
  }

  async remove(id: string, creatorId: string) {
    const asset = await this.assetModel.findById(id);
    if (!asset) return null;
    if (asset.creatorId.toString() !== creatorId) return null;
    return this.assetModel.findByIdAndDelete(id).exec();
  }

  async countByCategory() {
    return this.assetModel.aggregate([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);
  }

  async incrementViews(id: string) {
    return this.assetModel.findByIdAndUpdate(
      id,
      { $inc: { 'stats.viewCount': 1 } },
      { new: true },
    );
  }

  async findRelated(assetId: string, limit = 6) {
    const asset = await this.assetModel.findById(assetId);
    if (!asset) return [];
    return this.assetModel
      .find({
        _id: { $ne: asset._id },
        categoryId: asset.categoryId,
      })
      .populate(['categoryId', 'creatorId'])
      .sort({ 'ratings.average': -1, 'stats.downloadCount': -1 })
      .limit(limit)
      .exec();
  }

  findById(id: string) {
    return this.assetModel
      .findById(id)
      .populate(['categoryId', 'creatorId'])
      .exec();
  }
}
