import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { SessionService } from '../session/session.service';
import {
  EvaluationHistory,
  EvaluationResult,
  SessionStatus,
} from '../../common/interfaces/session.interface';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Generate evaluation for a teaching session
   */
  async evaluateSession(sessionId: string): Promise<EvaluationResult> {
    // Validate session exists
    const session = this.sessionService.getSession(sessionId);

    // Get conversation history
    const conversation = this.storageService.getConversation(sessionId);
    if (!conversation || conversation.messages.length === 0) {
      throw new Error('No conversation found for this session');
    }

    // Get lesson content
    const lessonContent = session.lessonContent || 'Lesson plan content';

    let pdfBuffer: Buffer | undefined;
    if (session.lessonFile && session.lessonFile.endsWith('.pdf')) {
      try {
        pdfBuffer = this.storageService.readLessonFile(sessionId, session.lessonFile);
      } catch (error) {
        this.logger.warn(`Could not read PDF file for session ${sessionId}`, error);
      }
    }

    // Generate evaluation from AI
    const aiEvaluation = await this.aiService.evaluateTeaching(
      conversation.messages,
      lessonContent,
      pdfBuffer,
    );

    // Parse AI response
    const evaluation = this.parseEvaluationResponse(aiEvaluation, sessionId);

    // Save evaluation
    this.saveEvaluation(sessionId, evaluation);

    // Update session status
    this.sessionService.updateSessionStatus(sessionId, SessionStatus.COMPLETED);

    this.logger.log(`Evaluation generated for session ${sessionId}`);

    return evaluation;
  }

  /**
   * Get all evaluations for a session
   */
  getEvaluations(sessionId: string): EvaluationHistory {
    const evaluations = this.storageService.getEvaluations(sessionId);
    if (!evaluations) {
      return {
        sessionId,
        evaluations: [],
      };
    }
    return evaluations;
  }

  /**
   * Parse AI evaluation response
   */
  private parseEvaluationResponse(aiResponse: string, sessionId: string): EvaluationResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const evaluation: EvaluationResult = {
        id: uuidv4().substring(0, 8),
        sessionId,
        createdAt: new Date().toISOString(),
        criteria: parsed.criteria || {
          baoQuatCaTheHoa: 5,
          tinhKheoLeo: 5,
          tinhKienNhan: 5,
          tinhLinhHoat: 5,
          tichHopKyNangNgonNgu: 5,
          tinhMucDich: 5,
          tinhTuDuy: 5,
          tinhVuaSuc: 5,
          tinhRoRang: 5,
        },
        overallScore: parsed.overallScore || 50,
        passed: parsed.passed || false,
        strengths: parsed.strengths || ['Không thể đánh giá'],
        weaknesses: parsed.weaknesses || ['Không thể đánh giá'],
        suggestions: parsed.suggestions || ['Vui lòng thử lại'],
        recommendation: parsed.recommendation || 'Không có đề xuất',
      };

      return evaluation;
    } catch (error) {
      this.logger.error('Failed to parse AI evaluation response', error);
      
      // Return a default evaluation if parsing fails
      return {
        id: uuidv4().substring(0, 8),
        sessionId,
        createdAt: new Date().toISOString(),
        criteria: {
          baoQuatCaTheHoa: 5,
          tinhKheoLeo: 5,
          tinhKienNhan: 5,
          tinhLinhHoat: 5,
          tichHopKyNangNgonNgu: 5,
          tinhMucDich: 5,
          tinhTuDuy: 5,
          tinhVuaSuc: 5,
          tinhRoRang: 5,
        },
        overallScore: 50,
        passed: false,
        strengths: ['Đã tham gia buổi dạy mô phỏng'],
        weaknesses: ['Không thể tạo đánh giá chi tiết'],
        suggestions: ['Vui lòng thử tạo đánh giá lại'],
        recommendation: 'Không thể tạo đề xuất chi tiết do lỗi xử lý.',
      };
    }
  }

  /**
   * Save evaluation to history
   */
  private saveEvaluation(sessionId: string, evaluation: EvaluationResult): void {
    let history = this.storageService.getEvaluations(sessionId);
    
    if (!history) {
      history = {
        sessionId,
        evaluations: [],
      };
    }

    history.evaluations.push(evaluation);
    this.storageService.saveEvaluations(sessionId, history);
  }
}
