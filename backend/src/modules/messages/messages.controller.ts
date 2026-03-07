import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /** Get all conversations for the authenticated user */
  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.messagesService.getConversations(req.user.sub);
  }

  /** Create or find a conversation with another user */
  @Post('conversations')
  createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
    return this.messagesService.findOrCreateConversation(
      req.user.sub,
      dto.participantId,
    );
  }

  /** Get messages for a conversation */
  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messagesService.getMessages(
      id,
      limit ? parseInt(limit) : 50,
      before,
    );
  }

  /** Send a message */
  @Post('send')
  sendMessage(@Req() req: any, @Body() dto: CreateMessageDto) {
    return this.messagesService.sendMessage(
      dto.conversationId,
      req.user.sub,
      dto.content,
    );
  }

  /** Mark conversation as read */
  @Post('conversations/:id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.markAsRead(id, req.user.sub);
  }

  /** Search users to chat with */
  @Get('users/search')
  searchUsers(@Req() req: any, @Query('q') query: string) {
    return this.messagesService.searchUsers(query, req.user.sub);
  }
}
