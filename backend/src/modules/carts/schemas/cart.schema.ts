import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

const CartItemSchema = new MongooseSchema(
  {
    assetId: { type: Types.ObjectId, ref: 'Asset', required: true },
    quantity: { type: Number, default: 1, min: 1 },
    options: { type: MongooseSchema.Types.Mixed, default: {} },
  },
  { _id: false },
);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items!: Array<{
    assetId: Types.ObjectId;
    quantity: number;
    options?: Record<string, any>;
  }>;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.index({ userId: 1 }, { unique: true, name: 'idx_carts_user' });
CartSchema.index({ 'items.assetId': 1 }, { name: 'idx_carts_asset' });
