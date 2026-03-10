import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RatingDocument = HydratedDocument<Rating>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  assetId!: Types.ObjectId;

  @Prop({ min: 1, max: 5, required: true })
  rating!: number;

  @Prop({ maxlength: 500 })
  comment?: string;

  @Prop({ default: false })
  isVerifiedPurchase?: boolean;

  @Prop({ default: 0, min: 0 })
  helpfulCount?: number;

  @Prop({ type: [Types.ObjectId], default: [] })
  helpfulUsers?: Types.ObjectId[];
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

// Create unique index on user + asset
RatingSchema.index(
  { userId: 1, assetId: 1 },
  { unique: true, name: 'idx_ratings_unique_user_asset' },
);
RatingSchema.index(
  { assetId: 1, createdAt: -1 },
  { name: 'idx_ratings_asset' },
);
RatingSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_ratings_user' });
RatingSchema.index({ rating: -1 }, { name: 'idx_ratings_value' });
RatingSchema.index({ helpfulCount: -1 }, { name: 'idx_ratings_helpful' });

// Index for querying ratings by value/score
RatingSchema.index({ value: 1 }, { name: 'idx_ratings_value' });

// Index for sorting by helpful count
RatingSchema.index({ helpful_count: -1 }, { name: 'idx_ratings_helpful' });
