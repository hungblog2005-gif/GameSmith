import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId!: Types.ObjectId;

  @Prop({ required: true, maxlength: 5000 })
  content!: string;

  @Prop({ enum: ['text', 'image', 'file', 'system'], required: true })
  type!: 'text' | 'image' | 'file' | 'system';

  @Prop({ default: false })
  isRead!: boolean;

  @Prop({ type: [Types.ObjectId], default: [] })
  readBy?: Types.ObjectId[];

  @Prop({ type: [Object], default: [] })
  attachments?: Array<any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for optimal query performance
MessageSchema.index({ conversationId: 1, createdAt: 1 }, { name: 'idx_messages_conversation' });
MessageSchema.index({ senderId: 1, createdAt: -1 }, { name: 'idx_messages_sender' });
MessageSchema.index({ conversationId: 1, isRead: 1 }, { name: 'idx_messages_unread' });
MessageSchema.index({ createdAt: -1 }, { name: 'idx_messages_date' });
