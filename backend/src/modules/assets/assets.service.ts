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

  create(dto: CreateAssetDto) {
    return this.assetModel.create({
      title: dto.title,
      description: dto.description,
      short_description: dto.short_description,
      price: dto.price,
      discount_percentage: dto.discount_percentage,
      is_free: dto.is_free,
      category: new Types.ObjectId(dto.categoryId),
      creator: new Types.ObjectId(dto.creatorId),
      thumbnail_url: dto.thumbnail_url,
      preview_images: dto.preview_images,
      slug: dto.slug,
      status: dto.status,
      tags: dto.tags,
      file_format: dto.file_format,
      file_size: dto.file_size,
      game_engine_support: dto.game_engine_support,
      license_type: dto.license_type,
      polygon_count: dto.polygon_count,
      texture_resolution: dto.texture_resolution,
      animated: dto.animated,
      rigged: dto.rigged,
      featured: dto.featured,
    });
  }

  findAll(filters?: { status?: string }) {
    const query: Record<string, any> = {};
    if (filters?.status) {
      query.status = filters.status;
    }
    return this.assetModel
      .find(query)
      .populate('category creator')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findFeatured(limit = 6) {
    let assets = await this.assetModel
      .find({ featured: true })
      .populate('category creator')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    // Fallback: if no featured assets, return latest assets
    if (assets.length === 0) {
      assets = await this.assetModel
        .find()
        .populate('category creator')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    }

    return assets;
  }

  findByCategory(categoryId: string) {
    return this.assetModel
      .find({ category: new Types.ObjectId(categoryId) })
      .populate('category creator')
      .exec();
  }

  findByCreator(creatorId: string) {
    return this.assetModel
      .find({ creator: new Types.ObjectId(creatorId) })
      .populate('category')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, creatorId: string, dto: Partial<CreateAssetDto>) {
    const asset = await this.assetModel.findById(id);
    if (!asset) return null;
    if (asset.creator.toString() !== creatorId) return null;

    const updateData: Record<string, any> = { ...dto };
    if (dto.categoryId) {
      updateData.category = new Types.ObjectId(dto.categoryId);
      delete updateData.categoryId;
    }
    delete updateData.creatorId;

    return this.assetModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category')
      .exec();
  }

  async remove(id: string, creatorId: string) {
    const asset = await this.assetModel.findById(id);
    if (!asset) return null;
    if (asset.creator.toString() !== creatorId) return null;
    return this.assetModel.findByIdAndDelete(id).exec();
  }

  async countByCategory() {
    return this.assetModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
  }

  async incrementViews(id: string) {
    return this.assetModel.findByIdAndUpdate(
      id,
      { $inc: { views_count: 1 } },
      { new: true },
    );
  }

  async findRelated(assetId: string, limit = 6) {
    const asset = await this.assetModel.findById(assetId);
    if (!asset) return [];
    return this.assetModel
      .find({
        _id: { $ne: asset._id },
        category: asset.category,
      })
      .populate('category creator')
      .sort({ ratings_average: -1, downloads_count: -1 })
      .limit(limit)
      .exec();
  }

  findById(id: string) {
    return this.assetModel
      .findById(id)
      .populate('category creator')
      .exec();
  }
}
