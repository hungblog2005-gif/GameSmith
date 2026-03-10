import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserCollectionDocument = HydratedDocument<UserCollection>;

@Schema({ timestamps: true, collection: 'user_collections' })
export class UserCollection {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, minlength: 3, maxlength: 100 })
  name!: string;

  @Prop({ maxlength: 500 })
  description?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Asset', default: [] })
  assets?: Types.ObjectId[];

  @Prop({ default: false })
  isPublic?: boolean;

  @Prop({ type: String, default: null })
  thumbnailUrl?: string | null;
}

export const UserCollectionSchema =
  SchemaFactory.createForClass(UserCollection);

// Indexes for optimal query performance
UserCollectionSchema.index(
  { userId: 1, name: 1 },
  { unique: true, name: 'idx_collections_unique_user_name' },
);
UserCollectionSchema.index(
  { userId: 1, isPublic: 1 },
  { name: 'idx_collections_user_public' },
);
UserCollectionSchema.index({ assets: 1 }, { name: 'idx_collections_assets' });
UserCollectionSchema.index(
  { isPublic: 1, createdAt: -1 },
  { name: 'idx_collections_public_recent' },
);
