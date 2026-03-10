import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, match: /^ORD-[0-9]{8}-[0-9]{6}$/ })
  orderNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({
    type: [
      {
        assetId: { type: Types.ObjectId, ref: 'Asset', required: true },
        price: { type: Number, required: true },
      },
    ],
    required: true,
  })
  items!: Array<{
    assetId: Types.ObjectId;
    price: number;
  }>;

  @Prop({ default: 0, min: 0 })
  subtotal?: number;

  @Prop({ default: 0, min: 0 })
  discountAmount?: number;

  @Prop({ default: 0, min: 0 })
  taxAmount?: number;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ enum: ['USD', 'EUR', 'GBP', 'VND'], default: 'VND' })
  currency?: string;

  @Prop({
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending',
  })
  status!: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

  @Prop({
    enum: ['pending', 'paid', 'failed', 'refunded'],
    required: true,
    default: 'pending',
  })
  paymentStatus!: 'pending' | 'paid' | 'failed' | 'refunded';

  @Prop({
    enum: ['credit_card', 'paypal', 'bank_transfer', 'wallet', 'momo_personal'],
  })
  paymentMethod?: string;

  @Prop({ type: String, default: null })
  paymentId?: string | null;

  @Prop({ maxlength: 500 })
  notes?: string;

  @Prop({ type: Date, default: null, nullable: true })
  completedAt?: Date | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for optimal query performance
OrderSchema.index(
  { orderNumber: 1 },
  { unique: true, sparse: true, name: 'idx_orders_number' },
);
OrderSchema.index(
  { userId: 1, createdAt: -1 },
  { name: 'idx_orders_user_created' },
);
OrderSchema.index(
  { status: 1, paymentStatus: 1 },
  { name: 'idx_orders_status_payment' },
);
OrderSchema.index({ 'items.assetId': 1 }, { name: 'idx_orders_asset_items' });
OrderSchema.index({ createdAt: -1 }, { name: 'idx_orders_created' });
