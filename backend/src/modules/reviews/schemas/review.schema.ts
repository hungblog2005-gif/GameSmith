import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  assetId!: Types.ObjectId;

  @Prop({ min: 1, max: 5, required: true })
  rating!: number;

  @Prop({ maxlength: 500 })
  comment?: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  verificationOrder?: Types.ObjectId;

  @Prop({ default: false })
  isVerifiedPurchase?: boolean;

  @Prop({ default: 0, min: 0 })
  helpfulCount?: number;

  @Prop({ type: [Types.ObjectId], default: [] })
  helpfulUsers?: Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Create compound unique index on user + asset
ReviewSchema.index(
  { userId: 1, assetId: 1 },
  { unique: true, name: 'idx_reviews_unique_user_asset' },
);
ReviewSchema.index(
  { assetId: 1, rating: -1 },
  { name: 'idx_reviews_asset_rating' },
);
ReviewSchema.index(
  { userId: 1, createdAt: -1 },
  { name: 'idx_reviews_user_date' },
);
