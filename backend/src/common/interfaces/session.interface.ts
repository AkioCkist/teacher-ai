/**
 * Session status enum
 */
export enum SessionStatus {
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

/**
 * Active student in classroom simulation
 */
export interface ActiveStudent {
  name: string;
  type: string;
  description: string;
}

/**
 * Parsed student response from AI output
 */
export interface ParsedStudentResponse {
  name: string;
  type: string;
  response: string;
}

/**
 * Session metadata stored in session.json
 */
export interface SessionMetadata {
  id: string;
  createdAt: string;
  status: SessionStatus;
  provider: string;
  lessonFile: string;
  lessonContent?: string;
}

/**
 * Conversation message for Gemini API
 */
export interface ConversationMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Conversation history stored in conversation.json
 */
export interface ConversationHistory {
  sessionId: string;
  messages: ConversationMessage[];
  activeStudents: ActiveStudent[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Student response in classroom simulation
 */
export interface StudentResponse {
  name: string;
  personality: string;
  response: string;
}

/**
 * Evaluation criteria
 */
export interface EvaluationCriteria {
  questioningTechniques: number;
  scaffolding: number;
  classroomManagement: number;
  encouragement: number;
  feedbackQuality: number;
  pedagogicalReasoning: number;
  communication: number;
  adaptability: number;
}

/**
 * Single evaluation result
 */
export interface EvaluationResult {
  id: string;
  sessionId: string;
  createdAt: string;
  criteria: EvaluationCriteria;
  overallScore: number;
  passed: boolean;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  recommendation: string;
}

/**
 * Evaluation history stored in evaluation.json
 */
export interface EvaluationHistory {
  sessionId: string;
  evaluations: EvaluationResult[];
}
