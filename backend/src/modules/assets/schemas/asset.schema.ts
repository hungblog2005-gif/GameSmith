import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssetDocument = Asset & Document;

@Schema({ timestamps: true })
export class Asset {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop()
  short_description?: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ default: 0 })
  discount_percentage!: number;

  @Prop({ default: false })
  is_free!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creator!: Types.ObjectId;

  @Prop()
  thumbnail_url?: string;

  @Prop({ type: [String], default: [] })
  preview_images!: string[];

  @Prop()
  slug?: string;

  @Prop({ default: 'draft' })
  status!: 'draft' | 'active' | 'inactive';

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  file_format!: string[];

  @Prop()
  file_size?: string;

  @Prop({ type: [String], default: [] })
  game_engine_support!: string[];

  @Prop()
  license_type?: string;

  @Prop({ default: 0 })
  polygon_count!: number;

  @Prop()
  texture_resolution?: string;

  @Prop({ default: false })
  animated!: boolean;

  @Prop({ default: false })
  rigged!: boolean;

  @Prop({ default: false })
  featured!: boolean;

  @Prop({ default: 0 })
  ratings_average!: number;

  @Prop({ default: 0 })
  ratings_count!: number;

  @Prop({ default: 0 })
  downloads_count!: number;

  @Prop({ default: 0 })
  views_count!: number;

  @Prop({ default: true })
  is_active!: boolean;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
