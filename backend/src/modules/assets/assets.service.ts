import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Asset, AssetDocument } from './schemas/asset.schema';
import { AssetSeo, AssetSeoDocument } from './schemas/asset-seo.schema';
import { CreateAssetDto } from './dto/create-asset.dto';
import { GenerateSeoDto } from './dto/generate-seo.dto';
import { RecommendationsService } from '../recommendations/recommendations.service';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
    @InjectModel(AssetSeo.name)
    private readonly assetSeoModel: Model<AssetSeoDocument>,
    @Optional()
    private readonly recommendationsService?: RecommendationsService,
  ) {}

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') +
      '-' +
      Date.now()
    );
  }

  async create(dto: CreateAssetDto) {
    try {
      const asset = await this.assetModel.create({
        title: dto.title,
        description: dto.description || '',
        shortDescription: dto.short_description || dto.description || '',
        price: dto.price,
        discountPercent: dto.discount_percentage || 0,
        isFree: dto.is_free || false,
        categoryId: new Types.ObjectId(dto.categoryId),
        creatorId: new Types.ObjectId(dto.creatorId),
        thumbnailUrl: dto.thumbnail_url || '',
        previewImages: dto.preview_images || [],
        slug: dto.slug
          ? dto.slug.toLowerCase().replace(/\s+/g, '-')
          : this.generateSlug(dto.title),
        status: dto.status || 'draft',
        tags: dto.tags || [],
        fileFormat: dto.file_format || [],
        fileSize: dto.file_size || '',
        gameEngineSupport: dto.game_engine_support || [],
        licenseType: dto.license_type || 'personal',
        polygonCount: dto.polygon_count || 0,
        ...(dto.texture_resolution
          ? { textureResolution: dto.texture_resolution }
          : {}),
        animated: dto.animated || false,
        rigged: dto.rigged || false,
        featured: dto.featured || false,
      });

      // Async: index the new asset in Qdrant (fire-and-forget, does not block response)
      if (this.recommendationsService) {
        setImmediate(() => this.recommendationsService!.indexAsset(asset));
      }

      // Async: generate SEO metadata (fire-and-forget, does not block response)
      setImmediate(() => {
        void this.generateAndSaveSeo(String(asset._id), {
          title: dto.title,
          short_description: dto.short_description || dto.description,
          tags: dto.tags,
          file_format: dto.file_format,
          license_type: dto.license_type,
        });
      });

      return asset;
    } catch (error) {
      console.error('Asset creation error:', error);
      throw error;
    }
  }

  async findAll(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }) {
    const query: Record<string, any> = {};
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.search) {
      const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    const limit = filters?.limit ?? 30;
    const skip = filters?.skip ?? 0;

    const [data, total] = await Promise.all([
      this.assetModel
        .find(query)
        .populate(['categoryId', 'creatorId'])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.assetModel.countDocuments(query),
    ]);

    return { data, total, limit, skip, hasMore: skip + data.length < total };
  }

  async findFeatured(limit = 6) {
    let assets = await this.assetModel
      .find({ featured: true, status: 'published' })
      .populate(['categoryId', 'creatorId'])
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    // Fallback: if no featured assets, return latest published assets
    if (assets.length === 0) {
      assets = await this.assetModel
        .find({ status: 'published' })
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

  async setFileKey(id: string, fileKey: string) {
    return this.assetModel
      .findByIdAndUpdate(id, { fileKey }, { new: true })
      .exec();
  }

  async addAssetFile(
    id: string,
    fileData: {
      fileKey: string;
      filename: string;
      format: string;
      fileSize?: string | null;
    },
  ) {
    return this.assetModel
      .findByIdAndUpdate(id, { $push: { assetFiles: fileData } }, { new: true })
      .exec();
  }

  async removeAssetFile(id: string, fileKey: string) {
    return this.assetModel
      .findByIdAndUpdate(
        id,
        { $pull: { assetFiles: { fileKey } } },
        { new: true },
      )
      .exec();
  }

  async getAssetFiles(id: string) {
    const asset = await this.assetModel
      .findById(id)
      .select('+assetFiles')
      .lean()
      .exec();
    if (!asset) return null;
    return (asset as any).assetFiles ?? [];
  }

  async remove(id: string, creatorId: string) {
    const asset = await this.assetModel.findById(id);
    if (!asset) return null;
    if (asset.creatorId.toString() !== creatorId) return null;
    const deleted = await this.assetModel.findByIdAndDelete(id).exec();
    if (deleted && this.recommendationsService) {
      setImmediate(() => this.recommendationsService!.deleteAssetIndex(id));
    }
    return deleted;
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

  async getTagVocabulary() {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${aiServiceUrl}/tags`);
      if (!res.ok) return { groups: [] };
      return await res.json();
    } catch {
      return { groups: [] };
    }
  }

  async suggestTags(dto: {
    thumbnail_url?: string;
    title?: string;
    description?: string;
    category_name?: string;
    file_names?: string[];
  }) {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    // Convert relative thumbnail URL to absolute so the AI service can fetch it
    const payload = { ...dto };
    if (payload.thumbnail_url?.startsWith('/')) {
      payload.thumbnail_url = `${backendUrl}${payload.thumbnail_url}`;
    }

    let res: Response;
    try {
      res = await fetch(`${aiServiceUrl}/suggest-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      // Native fetch wraps connection errors: err.code is undefined, err.cause.code has the real code
      const code = err?.code ?? err?.cause?.code;
      if (
        code !== 'ECONNREFUSED' &&
        code !== 'ECONNRESET' &&
        err?.message !== 'socket hang up' &&
        err?.message !== 'fetch failed'
      ) {
        console.warn(
          `[AssetsService] suggestTags: AI service unreachable — ${err?.message}`,
        );
      }
      return { suggested_tags: [] };
    }
    if (!res.ok) {
      console.warn(
        `[AssetsService] suggestTags: AI service returned ${res.status}`,
      );
      return { suggested_tags: [] };
    }
    return await res.json();
  }

  async generateAndSaveSeo(
    assetId: string,
    dto: GenerateSeoDto,
  ): Promise<void> {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${aiServiceUrl}/generate-seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) return;
      const data = await res.json();
      await this.assetSeoModel.findOneAndUpdate(
        { assetId: new Types.ObjectId(assetId) },
        {
          assetId: new Types.ObjectId(assetId),
          title: data.title,
          metaDescription: data.meta_description,
          keywords: data.keywords,
          slug: data.slug,
          seoDescription: data.seo_description,
          extraTags: data.extra_tags,
          generatedAt: new Date(),
        },
        { upsert: true, new: true },
      );
    } catch (err) {
      console.error('SEO generation failed for asset', assetId, err);
    }
  }

  async getSeoByAssetId(assetId: string) {
    return this.assetSeoModel
      .findOne({ assetId: new Types.ObjectId(assetId) })
      .lean()
      .exec();
  }
}
