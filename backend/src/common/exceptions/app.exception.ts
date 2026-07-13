import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for session not found
 */
export class SessionNotFoundException extends HttpException {
  constructor(sessionId: string) {
    super(`Session with ID "${sessionId}" not found`, HttpStatus.NOT_FOUND);
  }
}

/**
 * Custom exception for invalid file type
 */
export class InvalidFileTypeException extends HttpException {
  constructor(allowedTypes: string[]) {
    super(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Custom exception for AI service errors
 */
export class AIServiceException extends HttpException {
  constructor(message: string) {
    super(`AI Service Error: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Custom exception for conversation not found
 */
export class ConversationNotFoundException extends HttpException {
  constructor(sessionId: string) {
    super(
      `Conversation for session "${sessionId}" not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Custom exception for session already exists
 */
export class SessionAlreadyExistsException extends HttpException {
  constructor(sessionId: string) {
    super(`Session with ID "${sessionId}" already exists`, HttpStatus.CONFLICT);
  }
}

/**
 * Custom exception for TTS errors
 */
export class TTSException extends HttpException {
  constructor(message: string) {
    super(`TTS Error: ${message}`, HttpStatus.BAD_REQUEST);
  }
}
