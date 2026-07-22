const API_BASE = 'http://localhost:3000/api';

/**
 * All available personality types for student simulation
 */
export const PERSONALITY_TYPES = [
  { type: 'excellent', label: 'Giỏi', color: 'emerald' },
  { type: 'good', label: 'Khá', color: 'emerald' },
  { type: 'average', label: 'Trung bình', color: 'amber' },
  { type: 'weak', label: 'Yếu', color: 'rose' },
  { type: 'shy', label: 'Nhút nhát', color: 'rose' },
  { type: 'inattentive', label: 'Mất tập trung', color: 'rose' },
  { type: 'understands_cant_express', label: 'Hiểu nhưng khó diễn đạt', color: 'amber' },
  { type: 'limited_vocabulary', label: 'Vốn từ hạn chế', color: 'rose' },
  { type: 'confidently_wrong', label: 'Tự tin nhưng sai', color: 'rose' },
  { type: 'random_guess', label: 'Đoán mò', color: 'rose' },
  { type: 'creative', label: 'Sáng tạo', color: 'amber' },
  { type: 'quiet', label: 'Im lặng', color: 'rose' },
  { type: 'curious', label: 'Tò mò', color: 'amber' },
  { type: 'competitive', label: 'Cạnh tranh', color: 'rose' },
  { type: 'careless', label: 'Ẩu', color: 'rose' },
  { type: 'leader', label: 'Nhóm trưởng', color: 'emerald' },
  { type: 'visual', label: 'Trực quan', color: 'amber' },
  { type: 'slow_learner', label: 'Chậm hiểu', color: 'rose' },
  { type: 'perfectionist', label: 'Cầu toàn', color: 'rose' },
  { type: 'humorous', label: 'Hài hước', color: 'amber' },
]

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
  personalityTypes?: string[];
}

export interface ConversationMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface ConversationHistory {
  sessionId: string;
  messages: ConversationMessage[];
  activeStudents?: Array<{ name: string; type: string; description: string }>;
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

export interface StudentResponse {
  name: string;
  type: string;
  response: string;
}

/**
 * Upload a lesson plan and create a new session
 */
export async function uploadLessonPlan(
  file: File,
  lessonContent?: string,
  personalityTypes?: string[]
): Promise<CreateSessionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (lessonContent) {
    formData.append('lessonContent', lessonContent);
  }
  if (personalityTypes) {
    // Send personalityTypes as JSON string in FormData
    formData.append('personalityTypes', JSON.stringify(personalityTypes));
  }

  const response = await fetch(`${API_BASE}/session`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Tải lên giáo án thất bại');
  }

  return response.json();
}

/**
 * Attach a file to an ongoing chat session
 */
export async function attachFileToChat(
  sessionId: string,
  file: File,
  message?: string,
): Promise<{ filename: string; content: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (message) {
    formData.append('message', message);
  }

  const response = await fetch(`${API_BASE}/chat/${sessionId}/attach`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Đính kèm file thất bại');
  }

  return response.json();
}

/**
 * Get session metadata
 */
export async function getSession(sessionId: string): Promise<SessionMetadata> {
  const response = await fetch(`${API_BASE}/session/${sessionId}`);

  if (!response.ok) {
    throw new Error('Không tìm thấy buổi dạy');
  }

  return response.json();
}

/**
 * Send a teacher message
 */
export async function sendMessage(
  sessionId: string,
  message: string,
  replyToStudent?: string,
): Promise<{ response: string; students: StudentResponse[] }> {
  const response = await fetch(`${API_BASE}/chat/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, replyToStudent }),
  });

  if (!response.ok) {
    throw new Error('Gửi tin nhắn thất bại');
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
    throw new Error('Không tìm thấy hội thoại');
  }

  return response.json();
}

/**
 * List all sessions
 */
export async function listSessions(): Promise<SessionMetadata[]> {
  const response = await fetch(`${API_BASE}/session`);

  if (!response.ok) {
    throw new Error('Không thể tải danh sách buổi học');
  }

  return response.json();
}

/**
 * Update personality types for a session
 */
export async function updatePersonalityTypes(
  sessionId: string,
  personalityTypes: string[]
): Promise<SessionMetadata> {
  const response = await fetch(`${API_BASE}/session/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personalityTypes }),
  });

  if (!response.ok) {
    throw new Error('Không thể cập nhật cài đặt');
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
    throw new Error('Tạo đánh giá thất bại');
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
    throw new Error('Không tìm thấy đánh giá');
  }

  return response.json();
}
