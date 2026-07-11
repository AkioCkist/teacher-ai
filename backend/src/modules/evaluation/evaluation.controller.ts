import {
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationResult, EvaluationHistory } from '../../common/interfaces/session.interface';

@Controller('evaluate')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  /**
   * Generate evaluation for a teaching session
   * POST /api/evaluate/:sessionId
   */
  @Post(':sessionId')
  @HttpCode(HttpStatus.OK)
  async evaluateSession(
    @Param('sessionId') sessionId: string,
  ): Promise<EvaluationResult> {
    return this.evaluationService.evaluateSession(sessionId);
  }

  /**
   * Get all evaluations for a session
   * GET /api/evaluations/:sessionId
   */
  @Get(':sessionId')
  async getEvaluations(
    @Param('sessionId') sessionId: string,
  ): Promise<EvaluationHistory> {
    return this.evaluationService.getEvaluations(sessionId);
  }
}
