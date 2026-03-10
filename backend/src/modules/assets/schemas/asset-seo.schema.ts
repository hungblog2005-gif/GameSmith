import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssetSeoDocument = AssetSeo & Document;

@Schema({ timestamps: true })
export class AssetSeo {
  @Prop({
    type: Types.ObjectId,
    ref: 'Asset',
    required: true,
    unique: true,
    index: true,
  })
  assetId!: Types.ObjectId;

  @Prop({ maxlength: 70 })
  title?: string;

  @Prop({ maxlength: 200 })
  metaDescription?: string;

  @Prop({ type: [String], default: [] })
  keywords!: string[];

  @Prop()
  slug?: string;

  @Prop({ maxlength: 2000 })
  seoDescription?: string;

  @Prop({ type: [String], default: [] })
  extraTags!: string[];

  @Prop({ type: Date })
  generatedAt?: Date;
}

export const AssetSeoSchema = SchemaFactory.createForClass(AssetSeo);
