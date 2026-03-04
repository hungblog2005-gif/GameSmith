import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    required: true,
  })
  participants!: Types.ObjectId[];

  @Prop({ enum: ['direct', 'group'], required: true })
  type!: 'direct' | 'group';

  @Prop({ type: Object, default: null })
  lastMessage?: any;

  @Prop({ type: Date })
  lastMessageAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexes for optimal query performance
ConversationSchema.index({ participants: 1 }, { name: 'idx_conversations_participants' });
ConversationSchema.index({ lastMessageAt: -1 }, { name: 'idx_conversations_last_message' });
ConversationSchema.index({ participants: 1, lastMessageAt: -1 }, { name: 'idx_conversations_user_recent' });
ConversationSchema.index({ updatedAt: -1 }, { name: 'idx_conversations_recent' });
