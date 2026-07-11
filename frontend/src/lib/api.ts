const API_BASE = 'http://localhost:3000/api';

/**
 * API response types
 */
export interface CreateSessionResponse {
  sessionId: string;
  status: string;
}

export interface SessionMetadata {
  id: string;
  createdAt: string;
  status: 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR';
  provider: string;
  lessonFile: string;
  lessonContent?: string;
}

export interface ConversationMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface ConversationHistory {
  sessionId: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

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

export interface EvaluationHistory {
  sessionId: string;
  evaluations: EvaluationResult[];
}

/**
 * Upload a lesson plan and create a new session
 */
export async function uploadLessonPlan(
  file: File,
  lessonContent?: string
): Promise<CreateSessionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (lessonContent) {
    formData.append('lessonContent', lessonContent);
  }

  const response = await fetch(`${API_BASE}/session`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to upload lesson plan');
  }

  return response.json();
}

/**
 * Get session metadata
 */
export async function getSession(sessionId: string): Promise<SessionMetadata> {
  const response = await fetch(`${API_BASE}/session/${sessionId}`);

  if (!response.ok) {
    throw new Error('Session not found');
  }

  return response.json();
}

/**
 * Send a teacher message
 */
export async function sendMessage(
  sessionId: string,
  message: string
): Promise<{ response: string }> {
  const response = await fetch(`${API_BASE}/chat/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
  sessionId: string
): Promise<ConversationHistory> {
  const response = await fetch(`${API_BASE}/chat/history/${sessionId}`);

  if (!response.ok) {
    throw new Error('Conversation not found');
  }

  return response.json();
}

/**
 * Generate evaluation
 */
export async function generateEvaluation(
  sessionId: string
): Promise<EvaluationResult> {
  const response = await fetch(`${API_BASE}/evaluate/${sessionId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to generate evaluation');
  }

  return response.json();
}

/**
 * Get evaluation history
 */
export async function getEvaluationHistory(
  sessionId: string
): Promise<EvaluationHistory> {
  const response = await fetch(`${API_BASE}/evaluate/${sessionId}`);

  if (!response.ok) {
    throw new Error('Evaluation not found');
  }

  return response.json();
}
