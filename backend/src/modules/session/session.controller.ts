import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionService } from './session.service';
import { SessionMetadata } from '../../common/interfaces/session.interface';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * Create a new session with uploaded lesson plan
   * POST /api/session
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @UploadedFile() file: Express.Multer.File,
    @Body('lessonContent') lessonContent?: string,
    @Body('personalityTypes') personalityTypesRaw?: string,
  ): Promise<{ sessionId: string; status: string }> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // personalityTypes comes as JSON string from FormData
    let personalityTypes: string[] | undefined;
    if (personalityTypesRaw) {
      try { personalityTypes = JSON.parse(personalityTypesRaw); }
      catch { personalityTypes = undefined; }
    }

    const session = await this.sessionService.createSession(file, lessonContent, personalityTypes);
    return {
      sessionId: session.id,
      status: session.status,
    };
  }

  /**
   * List all sessions
   * GET /api/session
   */
  @Get()
  async listSessions(): Promise<SessionMetadata[]> {
    return this.sessionService.listSessions();
  }

  /**
   * Get session by ID
   * GET /api/session/:sessionId
   */
  @Get(':sessionId')
  async getSession(
    @Param('sessionId') sessionId: string,
  ): Promise<SessionMetadata> {
    return this.sessionService.getSession(sessionId);
  }

  /**
   * Update personality types
   * PATCH /api/session/:sessionId
   */
  @Patch(':sessionId')
  async updatePersonalityTypes(
    @Param('sessionId') sessionId: string,
    @Body('personalityTypes') personalityTypes: string[],
  ): Promise<SessionMetadata> {
    return this.sessionService.updatePersonalityTypes(sessionId, personalityTypes);
  }
}
