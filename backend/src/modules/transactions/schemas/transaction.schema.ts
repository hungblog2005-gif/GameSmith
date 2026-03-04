import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment', default: null })
  payment?: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ enum: ['card', 'paypal', 'wallet', 'bank_transfer'], required: true })
  method!: string;

  @Prop({ enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' })
  status!: 'pending' | 'success' | 'failed' | 'cancelled';

  @Prop({ type: String, default: null, sparse: true })
  transaction_id?: string | null;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, any>;

  @Prop({ type: String, default: null })
  error_message?: string | null;

  @Prop({ default: false })
  is_processed!: boolean;

  @Prop({ type: Date, default: null })
  processed_at?: Date | null;
}

export const TransactionSchema =
  SchemaFactory.createForClass(Transaction);

// Indexes for optimal query performance
TransactionSchema.index({ user: 1, created_at: -1 }, { name: 'idx_transactions_user_created' });
TransactionSchema.index({ order: 1 }, { name: 'idx_transactions_order' });
TransactionSchema.index({ status: 1 }, { name: 'idx_transactions_status' });
TransactionSchema.index(
  { transaction_id: 1 },
  { unique: true, sparse: true, name: 'idx_transactions_transaction_id' }
);
