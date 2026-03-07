import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument } from '../users/schemas/users.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /** Find or create a 1-on-1 conversation between two users */
  async findOrCreateConversation(userId: string, participantId: string) {
    const userOid = new Types.ObjectId(userId);
    const partOid = new Types.ObjectId(participantId);

    let conversation = await this.conversationModel
      .findOne({
        participants: { $all: [userOid, partOid], $size: 2 },
      })
      .populate('participants', 'username avatar_url')
      .populate({
        path: 'lastMessage',
        select: 'content senderId createdAt',
      })
      .exec();

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [userOid, partOid],
        type: 'direct',
      });
      conversation = await this.conversationModel
        .findById(conversation._id)
        .populate('participants', 'username avatar_url')
        .exec();
    }

    return conversation;
  }

  /** Get all conversations for a user */
  async getConversations(userId: string) {
    return this.conversationModel
      .find({ participants: new Types.ObjectId(userId) })
      .populate('participants', 'username avatar_url')
      .populate({
        path: 'lastMessage',
        select: 'content senderId createdAt',
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  /** Get messages for a conversation with pagination */
  async getMessages(conversationId: string, limit = 50, before?: string) {
    const query: Record<string, any> = {
      conversationId: new Types.ObjectId(conversationId),
    };
    if (before) {
      query._id = { $lt: new Types.ObjectId(before) };
    }
    return this.messageModel
      .find(query)
      .populate('senderId', 'username avatar_url')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /** Send a message */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' | 'file' | 'system' = 'text',
  ) {
    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      content,
      type,
    });

    // Update conversation's lastMessage and lastMessageAt
    const conversation = await this.conversationModel.findById(conversationId);
    if (conversation) {
      conversation.lastMessage = message._id as Types.ObjectId;
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    return this.messageModel
      .findById(message._id)
      .populate('senderId', 'username avatar_url')
      .exec();
  }

  /** Mark messages in a conversation as read for a user */
  async markAsRead(conversationId: string, userId: string) {
    const userOid = new Types.ObjectId(userId);
    await this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: userOid },
        isRead: false,
      },
      { $set: { isRead: true }, $addToSet: { readBy: userOid } },
    );
  }

  /** Search users to start a conversation with */
  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.length < 2) return [];
    return this.userModel
      .find({
        _id: { $ne: new Types.ObjectId(currentUserId) },
        username: { $regex: query, $options: 'i' },
      })
      .select('username avatar_url')
      .limit(10)
      .exec();
  }
}
