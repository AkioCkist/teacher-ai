import * as path from 'path';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import {
  ensureDirectoryExists,
  getSessionPath,
  getSessionFilePath,
  readJsonFile,
  writeJsonFile,
  fileExists,
  readFileContent,
  writeFileContent,
  listDirectories,
} from '../../common/utils/file.util';
import {
  SessionMetadata,
  ConversationHistory,
  EvaluationHistory,
} from '../../common/interfaces/session.interface';

@Injectable()
export class StorageService {
  private readonly SESSION_FILE = 'session.json';
  private readonly CONVERSATION_FILE = 'conversation.json';
  private readonly EVALUATION_FILE = 'evaluation.json';

  /**
   * Create a new session directory
   */
  createSessionDirectory(sessionId: string): void {
    const sessionPath = getSessionPath(sessionId);
    ensureDirectoryExists(sessionPath);
  }

  /**
   * Save lesson file to session
   */
  saveLessonFile(
    sessionId: string,
    filename: string,
    content: Buffer,
  ): string {
    const filePath = getSessionFilePath(sessionId, filename);
    writeFileContent(filePath, content);
    return filename;
  }

  /**
   * Read lesson file content
   */
  readLessonFile(sessionId: string, filename: string): Buffer {
    const filePath = getSessionFilePath(sessionId, filename);
    return Buffer.from(readFileContent(filePath));
  }

  /**
   * Save session metadata
   */
  saveSessionMetadata(sessionId: string, metadata: SessionMetadata): void {
    const filePath = getSessionFilePath(sessionId, this.SESSION_FILE);
    writeJsonFile(filePath, metadata);
  }

  /**
   * Get session metadata
   */
  getSessionMetadata(sessionId: string): SessionMetadata | null {
    const filePath = getSessionFilePath(sessionId, this.SESSION_FILE);
    return readJsonFile<SessionMetadata>(filePath);
  }

  /**
   * Save conversation history
   */
  saveConversation(
    sessionId: string,
    conversation: ConversationHistory,
  ): void {
    const filePath = getSessionFilePath(sessionId, this.CONVERSATION_FILE);
    writeJsonFile(filePath, conversation);
  }

  /**
   * Get conversation history
   */
  getConversation(sessionId: string): ConversationHistory | null {
    const filePath = getSessionFilePath(sessionId, this.CONVERSATION_FILE);
    return readJsonFile<ConversationHistory>(filePath);
  }

  /**
   * Save evaluation history
   */
  saveEvaluations(
    sessionId: string,
    evaluations: EvaluationHistory,
  ): void {
    const filePath = getSessionFilePath(sessionId, this.EVALUATION_FILE);
    writeJsonFile(filePath, evaluations);
  }

  /**
   * Get evaluation history
   */
  getEvaluations(sessionId: string): EvaluationHistory | null {
    const filePath = getSessionFilePath(sessionId, this.EVALUATION_FILE);
    return readJsonFile<EvaluationHistory>(filePath);
  }

  /**
   * Check if session exists
   */
  sessionExists(sessionId: string): boolean {
    const sessionPath = getSessionPath(sessionId);
    return fileExists(sessionPath);
  }

  /**
   * Check if lesson file exists
   */
  lessonFileExists(sessionId: string, filename: string): boolean {
    const filePath = getSessionFilePath(sessionId, filename);
    return fileExists(filePath);
  }

  /**
   * Get lesson file path
   */
  getLessonFilePath(sessionId: string, filename: string): string {
    return getSessionFilePath(sessionId, filename);
  }

  /**
   * List all session IDs sorted by most recent first
   */
  listAllSessions(): string[] {
    const sessionsDir = getSessionPath('');
    const dirs = listDirectories(sessionsDir);
    // Sort by directory creation time (newest first)
    dirs.sort((a, b) => {
      const aTime = fs.statSync(path.join(sessionsDir, a)).birthtimeMs;
      const bTime = fs.statSync(path.join(sessionsDir, b)).birthtimeMs;
      return bTime - aTime;
    });
    return dirs;
  }
}
