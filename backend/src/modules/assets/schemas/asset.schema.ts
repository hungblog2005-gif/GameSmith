import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssetDocument = Asset & Document;

@Schema({ timestamps: true })
export class Asset {
  @Prop({ required: true, minlength: 3, maxlength: 200 })
  title!: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId!: Types.ObjectId;

  @Prop({ maxlength: 200 })
  shortDescription?: string;

  @Prop({ maxlength: 5000 })
  description?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: 0, min: 0, max: 100 })
  discountPercent!: number;

  @Prop({ default: false })
  isFree!: boolean;

  @Prop({ enum: ['personal', 'commercial', 'enterprise', 'extended', 'free'] })
  licenseType?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  fileFormat!: string[];

  @Prop({ match: /^\d+(\.\d+)?\s*(MB|GB)$/ })
  fileSize?: string;

  @Prop({ type: Number, default: null })
  polygonCount?: number | null;

  @Prop({ enum: ['512', '1K', '2K', '4K', '8K', 'N/A'] })
  textureResolution?: string;

  @Prop({ default: false })
  rigged!: boolean;

  @Prop({ default: false })
  animated!: boolean;

  @Prop({ type: [String], default: [] })
  gameEngineSupport!: string[];

  @Prop({ type: [String], default: [] })
  previewImages!: string[];

  @Prop()
  thumbnailUrl?: string;

  @Prop({ type: String, default: null })
  videoDemoUrl?: string | null;

  @Prop({ match: /^\d+\.\d+\.\d+$/ })
  version?: string;

  @Prop({ enum: ['draft', 'pending', 'published', 'hidden', 'archived'], default: 'draft' })
  status!: 'draft' | 'pending' | 'published' | 'hidden' | 'archived';

  @Prop({ default: false })
  featured!: boolean;

  @Prop({ default: false })
  isTrending!: boolean;

  @Prop({ type: Object, default: {} })
  stats?: {
    downloadCount?: number;
    viewCount?: number;
    likeCount?: number;
    reviewCount?: number;
  };

  @Prop({ type: Object, default: {} })
  ratings?: {
    average?: number;
    count?: number;
  };
}

export const AssetSchema = SchemaFactory.createForClass(Asset);

// Transform camelCase fields to snake_case for frontend compatibility
AssetSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    // Rename populated refs
    if (ret['categoryId'] !== undefined) {
      ret['category'] = ret['categoryId'];
      delete ret['categoryId'];
    }
    if (ret['creatorId'] !== undefined) {
      ret['creator'] = ret['creatorId'];
      delete ret['creatorId'];
    }

    // Rename camelCase fields to snake_case
    if (ret['thumbnailUrl'] !== undefined) {
      ret['thumbnail_url'] = ret['thumbnailUrl'];
      delete ret['thumbnailUrl'];
    }
    if (ret['previewImages'] !== undefined) {
      ret['preview_images'] = ret['previewImages'];
      delete ret['previewImages'];
    }
    if (ret['discountPercent'] !== undefined) {
      ret['discount_percentage'] = ret['discountPercent'];
      delete ret['discountPercent'];
    }
    if (ret['isFree'] !== undefined) {
      ret['is_free'] = ret['isFree'];
      delete ret['isFree'];
    }
    if (ret['shortDescription'] !== undefined) {
      ret['short_description'] = ret['shortDescription'];
      delete ret['shortDescription'];
    }
    if (ret['gameEngineSupport'] !== undefined) {
      ret['game_engine_support'] = ret['gameEngineSupport'];
      delete ret['gameEngineSupport'];
    }
    if (ret['licenseType'] !== undefined) {
      ret['license_type'] = ret['licenseType'];
      delete ret['licenseType'];
    }
    if (ret['fileFormat'] !== undefined) {
      ret['file_format'] = ret['fileFormat'];
      delete ret['fileFormat'];
    }
    if (ret['fileSize'] !== undefined) {
      ret['file_size'] = ret['fileSize'];
      delete ret['fileSize'];
    }
    if (ret['polygonCount'] !== undefined) {
      ret['polygon_count'] = ret['polygonCount'];
      delete ret['polygonCount'];
    }
    if (ret['textureResolution'] !== undefined) {
      ret['texture_resolution'] = ret['textureResolution'];
      delete ret['textureResolution'];
    }
    if (ret['isTrending'] !== undefined) {
      ret['is_trending'] = ret['isTrending'];
      delete ret['isTrending'];
    }
    if (ret['videoDemoUrl'] !== undefined) {
      ret['video_demo_url'] = ret['videoDemoUrl'];
      delete ret['videoDemoUrl'];
    }

    return ret;
  },
});

// Indexes for optimal query performance
AssetSchema.index({ slug: 1 }, { name: 'idx_assets_slug' });
AssetSchema.index({ creatorId: 1, status: 1 }, { name: 'idx_assets_creator_status' });
AssetSchema.index({ categoryId: 1, status: 1 }, { name: 'idx_assets_category_status' });
AssetSchema.index({ tags: 1 }, { name: 'idx_assets_tags' });
AssetSchema.index({ price: 1 }, { name: 'idx_assets_price' });
AssetSchema.index({ status: 1, featured: 1 }, { name: 'idx_assets_status_featured' });
AssetSchema.index({ 'stats.downloadCount': -1 }, { name: 'idx_assets_downloads' });
AssetSchema.index({ 'ratings.average': -1 }, { name: 'idx_assets_ratings_avg' });
AssetSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { name: 'idx_assets_text' }
);
AssetSchema.index({ createdAt: -1 }, { name: 'idx_assets_created' });
