import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { parseOffice } from 'officeparser';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { SessionMetadata, SessionStatus } from '../../common/interfaces/session.interface';
import {
  SessionNotFoundException,
  InvalidFileTypeException,
  SessionAlreadyExistsException,
} from '../../common/exceptions/app.exception';

/**
 * Allowed file types for lesson plans
 */
const ALLOWED_FILE_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Create a new session with uploaded lesson plan
   */
  async createSession(
    file: Express.Multer.File,
    lessonContent?: string,
  ): Promise<SessionMetadata> {
    // Validate file type
    const fileExtension = ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES];
    if (!fileExtension) {
      throw new InvalidFileTypeException(Object.keys(ALLOWED_FILE_TYPES));
    }

    // Generate session ID
    const sessionId = this.generateSessionId();

    // Check if session already exists (very unlikely but good practice)
    if (this.storageService.sessionExists(sessionId)) {
      throw new SessionAlreadyExistsException(sessionId);
    }

    // Create session directory
    this.storageService.createSessionDirectory(sessionId);

    // Save lesson file
    const lessonFilename = `lesson.${fileExtension}`;
    this.storageService.saveLessonFile(sessionId, lessonFilename, file.buffer);

    // Create session metadata
    const sessionMetadata: SessionMetadata = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      status: SessionStatus.READY,
      provider: 'openrouter',
      lessonFile: lessonFilename,
      lessonContent: lessonContent,
    };

    // Save metadata
    this.storageService.saveSessionMetadata(sessionId, sessionMetadata);

    // Process lesson plan with AI
    try {
      const contentToProcess = lessonContent || await this.extractContentFromBuffer(file.buffer, fileExtension);
      
      // Save the processed lesson content in session metadata so it is persisted
      sessionMetadata.lessonContent = contentToProcess;
      this.storageService.saveSessionMetadata(sessionId, sessionMetadata);

      let pdfBuffer: Buffer | undefined;
      if (fileExtension === 'pdf') {
        pdfBuffer = file.buffer;
      }

      const aiResponse = await this.aiService.processLessonPlan(contentToProcess, pdfBuffer);
      this.logger.log(`Lesson plan processed for session ${sessionId}: ${aiResponse.substring(0, 100)}...`);
    } catch (error) {
      this.logger.error(`Failed to process lesson plan for session ${sessionId}`, error);
      // Update status to error but don't throw - session can still be used
      sessionMetadata.status = SessionStatus.ERROR;
      this.storageService.saveSessionMetadata(sessionId, sessionMetadata);
    }

    return sessionMetadata;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionMetadata {
    const session = this.storageService.getSessionMetadata(sessionId);
    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }
    return session;
  }

  /**
   * Update session status
   */
  updateSessionStatus(sessionId: string, status: SessionStatus): SessionMetadata {
    const session = this.getSession(sessionId);
    session.status = status;
    this.storageService.saveSessionMetadata(sessionId, session);
    return session;
  }

  /**
   * List all sessions with metadata
   */
  listSessions(): SessionMetadata[] {
    const ids = this.storageService.listAllSessions();
    return ids
      .map(id => {
        try { return this.getSession(id); }
        catch { return null; }
      })
      .filter((s): s is SessionMetadata => s !== null);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return uuidv4().substring(0, 8);
  }

  /**
   * Extract content from file buffer
   */
  private async extractContentFromBuffer(buffer: Buffer, extension: string): Promise<string> {
    try {
      this.logger.log(`Extracting text from uploaded ${extension} file...`);
      
      // Parse file buffer using officeparser
      const parseResult = await parseOffice(buffer, { fileType: extension as any });
      
      let text: string;
      if (typeof parseResult === 'string') {
        text = parseResult;
      } else if (parseResult && typeof (parseResult as any).toText === 'function') {
        text = (parseResult as any).toText();
      } else {
        text = String(parseResult);
      }

      this.logger.log(`Extracted ${text.length} characters from document.`);
      return text;
    } catch (error) {
      this.logger.error(`Failed to extract text from ${extension} file`, error);
      return `[Failed to extract content from ${extension} file]`;
    }
  }
}
