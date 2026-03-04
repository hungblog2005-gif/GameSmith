import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ enum: ['momo', 'vnpay', 'stripe', 'bank', 'paypal', 'credit_card', 'wallet'], required: true })
  method!: string;

  @Prop({ enum: ['momo', 'vnpay', 'stripe', 'paypal'] })
  gateway?: string;

  @Prop({ enum: ['pending', 'success', 'failed', 'refunded', 'cancelled', 'processing', 'expired'], default: 'pending' })
  status!: string;

  @Prop({ type: String, default: null, sparse: true })
  transactionId?: string | null;

  @Prop({ type: Object, default: null })
  gatewayResponse?: any;

  @Prop()
  paymentUrl?: string;

  @Prop()
  returnUrl?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: Date, default: null })
  paidAt?: Date | null;

  @Prop({ type: Date, default: null })
  expiredAt?: Date | null;

  @Prop({ maxlength: 500 })
  failureReason?: string;

  @Prop({ type: Number, max: 100 })
  refundPercentage?: number;

  @Prop({ type: Date, default: null })
  refundedAt?: Date | null;

  @Prop({ maxlength: 500 })
  refundReason?: string;

  @Prop({ type: Object, default: {} })
  metadata?: any;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes for optimal query performance
PaymentSchema.index(
  { orderId: 1 },
  { name: 'idx_payments_order' }
);
PaymentSchema.index(
  { userId: 1, created_at: -1 },
  { name: 'idx_payments_user_history' }
);
PaymentSchema.index(
  { transactionId: 1 },
  { unique: true, sparse: true, name: 'idx_payments_transaction_unique' }
);
PaymentSchema.index(
  { status: 1, createdAt: -1 },
  { name: 'idx_payments_status' }
);
PaymentSchema.index(
  { method: 1, status: 1 },
  { name: 'idx_payments_method_status' }
);
// TTL index - auto delete old pending/failed payments after 90 days
PaymentSchema.index(
  { expiredAt: 1 },
  {
    expireAfterSeconds: 7776000,
    partialFilterExpression: { status: { $in: ['pending', 'failed'] } },
    name: 'idx_payments_ttl',
  }
);
