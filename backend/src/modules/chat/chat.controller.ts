import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
   * Upload file attachment for current chat session
   * POST /api/chat/:sessionId/attach
   */
  @Post(':sessionId/attach')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @HttpCode(HttpStatus.OK)
  async attachFile(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('message') message?: string,
  ): Promise<{ filename: string; content: string }> {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.chatService.attachFile(sessionId, file, message);
  }

  /**
   * Get conversation history
   * GET /api/history/:sessionId
   */
  @Get('history/:sessionId')
  @Get('history/:sessionId')
  async getHistory(
    @Param('sessionId') sessionId: string,
  ): Promise<ConversationHistory> {
    return this.chatService.getConversation(sessionId);
  }
}
