import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type DownloadLogDocument = DownloadLog & Document;

@Schema({ timestamps: true })
export class DownloadLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  assetId!: Types.ObjectId;

  /** Snapshot of asset title at download time — preserved even if asset is later deleted */
  @Prop({ required: true, maxlength: 200 })
  assetTitle!: string;

  /** Snapshot of asset version at download time */
  @Prop({ default: '1.0.0' })
  version!: string;

  /** The file key that was served */
  @Prop({ type: String, default: null })
  fileKey?: string | null;

  /** Whether the file was served from cloud storage or local VPS */
  @Prop({ enum: ['cloud', 'local'], required: true })
  source!: 'cloud' | 'local';
}

export const DownloadLogSchema = SchemaFactory.createForClass(DownloadLog);

// Query: user views their own download history (newest first)
DownloadLogSchema.index(
  { userId: 1, createdAt: -1 },
  { name: 'idx_downloadlogs_user_created' },
);

// Query: admin stats — which assets are downloaded most
DownloadLogSchema.index(
  { assetId: 1, createdAt: -1 },
  { name: 'idx_downloadlogs_asset_created' },
);
