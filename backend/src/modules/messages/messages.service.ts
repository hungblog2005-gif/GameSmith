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
        path: 'last_message',
        select: 'content sender createdAt',
      })
      .exec();

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [userOid, partOid],
        unread_count: new Map([
          [userId, 0],
          [participantId, 0],
        ]),
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
        path: 'last_message',
        select: 'content sender createdAt',
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  /** Get messages for a conversation with pagination */
  async getMessages(conversationId: string, limit = 50, before?: string) {
    const query: Record<string, any> = {
      conversation: new Types.ObjectId(conversationId),
    };
    if (before) {
      query._id = { $lt: new Types.ObjectId(before) };
    }
    return this.messageModel
      .find(query)
      .populate('sender', 'username avatar_url')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /** Send a message */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ) {
    const message = await this.messageModel.create({
      conversation: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(senderId),
      content,
    });

    // Update conversation's last_message and increment unread for others
    const conversation = await this.conversationModel.findById(conversationId);
    if (conversation) {
      conversation.last_message = message._id as Types.ObjectId;
      // Increment unread count for all participants except sender
      for (const participantId of conversation.participants) {
        const pid = participantId.toString();
        if (pid !== senderId) {
          const current = conversation.unread_count?.get(pid) || 0;
          conversation.unread_count?.set(pid, current + 1);
        }
      }
      await conversation.save();
    }

    return this.messageModel
      .findById(message._id)
      .populate('sender', 'username avatar_url')
      .exec();
  }

  /** Mark messages in a conversation as read for a user */
  async markAsRead(conversationId: string, userId: string) {
    await this.messageModel.updateMany(
      {
        conversation: new Types.ObjectId(conversationId),
        sender: { $ne: new Types.ObjectId(userId) },
        is_read: false,
      },
      { $set: { is_read: true } },
    );

    // Reset unread count
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { [`unread_count.${userId}`]: 0 },
    });
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
