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

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  last_message?: Types.ObjectId;

  @Prop({ type: Map, of: Number, default: {} })
  unread_count!: Map<string, number>;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
