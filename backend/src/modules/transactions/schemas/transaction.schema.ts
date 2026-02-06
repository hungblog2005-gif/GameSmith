import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order!: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ enum: ['card', 'paypal', 'wallet'], required: true })
  method!: string;

  @Prop({ enum: ['pending', 'success', 'failed'], default: 'pending' })
  status!: string;
}

export const TransactionSchema =
  SchemaFactory.createForClass(Transaction);
