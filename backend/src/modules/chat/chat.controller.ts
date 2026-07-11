import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ConversationHistory, ParsedStudentResponse } from '../../common/interfaces/session.interface';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Send a teacher message and get student responses
   * POST /api/chat/:sessionId
   */
  @Post(':sessionId')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body('message') message: string,
    @Body('replyToStudent') replyToStudent?: string,
  ): Promise<{ response: string; students: ParsedStudentResponse[] }> {
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    const result = await this.chatService.sendMessage(sessionId, message, replyToStudent);
    return { response: result.rawResponse, students: result.students };
  }

  /**
   * Get conversation history
   * GET /api/history/:sessionId
   */
  @Get('history/:sessionId')
  async getHistory(
    @Param('sessionId') sessionId: string,
  ): Promise<ConversationHistory> {
    return this.chatService.getConversation(sessionId);
  }
}
