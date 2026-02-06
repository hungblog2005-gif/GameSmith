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
}

export const ReviewSchema = SchemaFactory.createForClass(Review)

