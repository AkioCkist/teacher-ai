import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { parseOffice } from 'officeparser';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { SessionService } from '../session/session.service';
import {
  ConversationHistory,
  ConversationMessage,
  ParsedStudentResponse,
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
  async sendMessage(
    sessionId: string,
    teacherMessage: string,
    replyToStudent?: string,
  ): Promise<{ rawResponse: string; students: ParsedStudentResponse[] }> {
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

    // Prefix message if replying to a specific student
    const historyMessage = replyToStudent
      ? `[@${replyToStudent}] ${teacherMessage}`
      : teacherMessage;

    // Add teacher message to history
    const userMessage: ConversationMessage = {
      role: 'user',
      parts: [{ text: historyMessage }],
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

    // Pass active students (if already selected) and replyToStudent to AI
    const activeStudents = conversation.activeStudents?.length > 0
      ? conversation.activeStudents
      : undefined;

    // When replying to a student, include @Name in the message sent to AI
    // so the latest prompt clearly shows who is being addressed
    const aiMessage = replyToStudent
      ? `[@${replyToStudent}] ${teacherMessage}`
      : teacherMessage;

    const result = await this.aiService.generateClassroomResponse(
      conversation.messages,
      aiMessage,
      session.lessonContent,
      pdfBuffer,
      activeStudents,
      replyToStudent,
    );

    // Store active students on first response
    if (!conversation.activeStudents || conversation.activeStudents.length === 0) {
      conversation.activeStudents = result.activeStudents;
    }

    // Add AI response to history
    const modelMessage: ConversationMessage = {
      role: 'model',
      parts: [{ text: result.rawResponse }],
    };
    conversation.messages.push(modelMessage);

    // Update timestamp and save
    conversation.updatedAt = new Date().toISOString();
    this.storageService.saveConversation(sessionId, conversation);

    this.logger.debug(`Message added to session ${sessionId}`);

    return { rawResponse: result.rawResponse, students: result.parsedStudents };
  }

  /**
   * Attach file to chat — save file, extract text, add to conversation
   */
  async attachFile(
    sessionId: string,
    file: Express.Multer.File,
    optionalMessage?: string,
  ): Promise<{ filename: string; content: string }> {
    const session = this.sessionService.getSession(sessionId);

    // Determine extension
    const extMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/plain': 'txt',
    };
    const ext = extMap[file.mimetype] || 'bin';

    // Save file
    const filename = `attachment_${uuidv4().substring(0, 8)}.${ext}`;
    this.storageService.saveLessonFile(sessionId, filename, file.buffer);

    // Extract text
    let extractedContent = '';
    if (ext === 'pdf' || ext === 'docx' || ext === 'pptx') {
      try {
        const parseResult = await parseOffice(file.buffer, { fileType: ext as any });
        extractedContent = typeof parseResult === 'string' ? parseResult : String(parseResult || '');
      } catch (e) {
        this.logger.warn(`Failed to extract text from attached ${ext} file`, e);
        extractedContent = `[Không thể trích xuất nội dung từ ${file.originalname}]`;
      }
    } else if (ext === 'txt') {
      extractedContent = file.buffer.toString('utf-8');
    }

    // Build user message with file content
    const header = optionalMessage
      ? `${optionalMessage}\n\n[Đã đính kèm: ${file.originalname}]`
      : `[Đã đính kèm tài liệu: ${file.originalname}]`;

    const fullMessage = `${header}\n\nNội dung tài liệu:\n${extractedContent}`;

    const userMessage: ConversationMessage = {
      role: 'user',
      parts: [{ text: fullMessage }],
    };

    // Get or create conversation
    let conversation = this.storageService.getConversation(sessionId);
    if (!conversation) {
      conversation = {
        sessionId,
        messages: [],
        activeStudents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    conversation.messages.push(userMessage);
    conversation.updatedAt = new Date().toISOString();
    this.storageService.saveConversation(sessionId, conversation);

    // Update session status if ready
    if (session.status === SessionStatus.READY) {
      this.sessionService.updateSessionStatus(sessionId, SessionStatus.IN_PROGRESS);
    }

    this.logger.log(`File ${file.originalname} attached to session ${sessionId}`);

    return { filename: file.originalname, content: extractedContent };
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
      activeStudents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
