import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  order!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user!: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({
    enum: ['card', 'paypal', 'wallet', 'bank_transfer'],
    required: true,
  })
  method!: string;

  @Prop({
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending',
    index: true,
  })
  status!: 'pending' | 'success' | 'failed' | 'cancelled';

  @Prop({ type: String, default: null, sparse: true })
  transaction_id?: string | null; // ID từ payment gateway

  @Prop({ type: Object, default: null })
  gateway_response?: any; // Response từ payment gateway

  @Prop({ type: String, default: null })
  error_message?: string | null; // Lỗi nếu thanh toán thất bại

  @Prop({ default: false })
  is_processed!: boolean; // Flag để tránh double payment

  @Prop({ type: Date, default: null })
  processed_at?: Date | null; // Thời gian xử lý callback

  // Idempotency key
  @Prop({ type: String, unique: true, sparse: true })
  idempotency_key?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indices để tối ưu query
PaymentSchema.index({ order: 1, status: 1 });
PaymentSchema.index({ user: 1, created_at: -1 });
