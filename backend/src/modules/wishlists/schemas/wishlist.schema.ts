import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type WishlistDocument = HydratedDocument<Wishlist>

@Schema({ timestamps: true })
export class Wishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  assetId!: Types.ObjectId
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist)

// Indexes for optimal query performance
WishlistSchema.index(
  { userId: 1, assetId: 1 },
  { unique: true, sparse: true, name: 'idx_wishlists_unique_user_asset' }
)
WishlistSchema.index({ userId: 1 }, { name: 'idx_wishlists_user' })
WishlistSchema.index({ assetId: 1 }, { name: 'idx_wishlists_asset' })
