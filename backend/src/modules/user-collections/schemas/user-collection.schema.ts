import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type UserCollectionDocument = HydratedDocument<UserCollection>

@Schema({ timestamps: true })
export class UserCollection {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  asset!: Types.ObjectId

  @Prop({ default: Date.now })
  purchasedAt!: Date
}

export const UserCollectionSchema =
  SchemaFactory.createForClass(UserCollection)
