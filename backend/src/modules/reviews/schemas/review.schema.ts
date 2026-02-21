import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type ReviewDocument = HydratedDocument<Review>

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  asset!: Types.ObjectId

  @Prop({ min: 1, max: 5, required: true })
  rating!: number

  @Prop()
  comment?: string

  // Ensure one review per user per asset
  @Prop({ index: true })
  uniqueUserAsset?: string

  // Verify user purchased the asset
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  verification_order?: Types.ObjectId

  // Prevent spam/fake ratings
  @Prop({ default: false })
  is_verified?: boolean

  @Prop({ default: 0 })
  helpful_count?: number

  @Prop({ type: [Types.ObjectId], default: [] })
  helpful_by?: Types.ObjectId[]

  createdAt?: Date
  updatedAt?: Date
}

export const ReviewSchema = SchemaFactory.createForClass(Review)

// Create compound unique index on user + asset
ReviewSchema.index({ user: 1, asset: 1 }, { unique: true })

