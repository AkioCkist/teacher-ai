import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { SessionService } from '../session/session.service';
import {
  ConversationHistory,
  ConversationMessage,
  SessionStatus,
} from '../../common/interfaces/session.interface';
import { ConversationNotFoundException } from '../../common/exceptions/app.exception';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Send a teacher message and get student responses
   */
  async sendMessage(sessionId: string, teacherMessage: string): Promise<string> {
    // Validate session exists
    const session = this.sessionService.getSession(sessionId);
    
    // Update session status to in_progress
    if (session.status === SessionStatus.READY) {
      this.sessionService.updateSessionStatus(sessionId, SessionStatus.IN_PROGRESS);
    }

    // Get or create conversation history
    let conversation = this.storageService.getConversation(sessionId);
    if (!conversation) {
      conversation = this.createConversation(sessionId);
    }

    // Add teacher message to history
    const userMessage: ConversationMessage = {
      role: 'user',
      parts: [{ text: teacherMessage }],
    };
    conversation.messages.push(userMessage);

    let pdfBuffer: Buffer | undefined;
    if (session.lessonFile && session.lessonFile.endsWith('.pdf')) {
      try {
        pdfBuffer = this.storageService.readLessonFile(sessionId, session.lessonFile);
      } catch (error) {
        this.logger.warn(`Could not read PDF file for session ${sessionId}`, error);
      }
    }

    // Get AI response
    const aiResponse = await this.aiService.generateClassroomResponse(
      conversation.messages,
      teacherMessage,
      session.lessonContent,
      pdfBuffer,
    );

    // Add AI response to history
    const modelMessage: ConversationMessage = {
      role: 'model',
      parts: [{ text: aiResponse }],
    };
    conversation.messages.push(modelMessage);

    // Update timestamp and save
    conversation.updatedAt = new Date().toISOString();
    this.storageService.saveConversation(sessionId, conversation);

    this.logger.debug(`Message added to session ${sessionId}`);

    return aiResponse;
  }

  /**
   * Get conversation history
   */
  getConversation(sessionId: string): ConversationHistory {
    const conversation = this.storageService.getConversation(sessionId);
    if (!conversation) {
      throw new ConversationNotFoundException(sessionId);
    }
    return conversation;
  }

  /**
   * Create new conversation history
   */
  private createConversation(sessionId: string): ConversationHistory {
    return {
      sessionId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
