import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({
    type: [
      {
        asset: { type: Types.ObjectId, ref: 'Asset', required: true },
        price: { type: Number, required: true },
      },
    ],
    required: true,
  })
  items!: {
    asset: Types.ObjectId;
    price: number;
  }[];

  @Prop({ required: true })
  total_price!: number;

  @Prop({ default: 'pending' })
  status!: 'pending' | 'paid' | 'cancelled';
}

export const OrderSchema = SchemaFactory.createForClass(Order);
