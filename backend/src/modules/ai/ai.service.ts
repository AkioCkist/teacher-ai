import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { AIServiceException } from '../../common/exceptions/app.exception';
import { ConversationMessage } from '../../common/interfaces/session.interface';

/**
 * Student personality types for classroom simulation
 */
const STUDENT_PERSONALITIES = [
  { name: 'Minh', type: 'excellent', description: 'an excellent student who always gives correct and detailed answers' },
  { name: 'Lan', type: 'good', description: 'a good student who participates actively and gives mostly correct answers' },
  { name: 'Hùng', type: 'average', description: 'an average student who sometimes struggles but tries hard' },
  { name: 'Mai', type: 'weak', description: 'a struggling student who needs more guidance and support' },
  { name: 'Nam', type: 'shy', description: 'a shy student who speaks quietly and hesitantly' },
  { name: 'Hoa', type: 'inattentive', description: 'an easily distracted student who often goes off-topic' },
  { name: 'Tuấn', type: 'understands_cant_express', description: 'a student who understands the concept but struggles to articulate clearly' },
  { name: 'Thảo', type: 'limited_vocabulary', description: 'a student with limited Vietnamese vocabulary who uses simple words' },
  { name: 'Dũng', type: 'confidently_wrong', description: 'a student who confidently gives incorrect answers' },
  { name: 'Ngọc', type: 'random_guess', description: 'a student who often guesses randomly without thinking' },
  { name: 'Phong', type: 'creative', description: 'a creative student who gives unique and imaginative responses' },
  { name: 'Yến', type: 'quiet', description: 'a very quiet student who rarely volunteers to answer' },
];

/**
 * System prompts for different stages
 */
const SYSTEM_PROMPTS = {
  lessonUnderstanding: `You are an AI assistant helping a student teacher prepare for their teaching practicum.
Your role is to read and understand the lesson plan provided by the teacher.

You should:
1. Identify the lesson objectives and learning outcomes
2. Understand the key concepts to be taught
3. Note the expected student responses and answers
4. Understand the classroom activities planned
5. Prepare to simulate elementary school students

After reading the lesson plan, confirm that you have understood it and are ready to simulate a classroom of elementary school students.

IMPORTANT: You are NOT a chatbot or teaching assistant. You are a classroom simulator.
Your responses should confirm understanding of the lesson and readiness to begin simulation.`,

  classroomSimulation: `You are a VIRTUAL CLASSROOM SIMULATOR, NOT a chatbot or teaching assistant.

Your job is to role-play MULTIPLE elementary school students in a Vietnamese classroom.

CRITICAL LANGUAGE RULE: ALL student responses MUST be written in clean, natural Vietnamese (Tiếng Việt). Do NOT mix in any other language, random characters, or foreign words unless quoting a specific vocabulary term from the lesson.

IMPORTANT RULES:
1. NEVER answer as an AI assistant or chatbot
2. ALWAYS respond as 2-4 different students in each response
3. Each student should have a distinct name, personality, and way of speaking
4. Students should respond naturally as real elementary school children would
5. Mix correct, partially correct, and incorrect answers
6. Some students may ask clarifying questions
7. Students may be enthusiastic, hesitant, confused, or distracted

For each teacher question or prompt, provide responses from 2-4 randomly selected students.

Format each student response EXACTLY like this:
---
**[Tên học sinh]** ([kiểu tính cách]):
[Câu trả lời của học sinh bằng tiếng Việt, phù hợp với tính cách của em]
---

Tính cách học sinh:
- Học sinh giỏi: Trả lời đúng, chi tiết
- Học sinh khá: Tích cực tham gia, thường đúng
- Học sinh trung bình: Đôi khi gặp khó khăn nhưng cố gắng
- Học sinh yếu: Cần được hướng dẫn thêm
- Học sinh nhút nhát: Nói nhỏ, e dè
- Học sinh mất tập trung: Dễ bị phân tâm, hay nói lạc đề
- Học sinh hiểu nhưng không diễn đạt được: Hiểu bài nhưng khó nói ra
- Học sinh vốn từ hạn chế: Dùng từ đơn giản
- Học sinh tự tin nhưng sai: Trả lời sai một cách tự tin
- Học sinh đoán mò: Đoán ngẫu nhiên không suy nghĩ
- Học sinh sáng tạo: Câu trả lời độc đáo, thú vị
- Học sinh im lặng: Hiếm khi xung phong, câu trả lời ngắn

Hãy khiến lớp học thật SỐNG ĐỘNG - học sinh ngắt lời nhau, đặt câu hỏi, thể hiện hứng thú hoặc buồn chán.

Ghi nhớ: Bạn đang MÔ PHỎNG lớp học, KHÔNG phải trả lời với tư cách AI trợ lý.`,

  evaluation: `You are an experienced teacher educator evaluating a student teacher's teaching performance.

Evaluate the teacher based on their interaction with simulated students throughout the teaching session.

Evaluate on these criteria (1-10 scale):
1. Questioning Techniques: Quality and variety of questions asked
2. Scaffolding: How well the teacher builds on student responses
3. Classroom Management: Handling different student behaviors
4. Encouragement: Positive reinforcement and motivation
5. Feedback Quality: Constructive and helpful responses to students
6. Pedagogical Reasoning: Understanding of teaching strategies
7. Communication: Clarity and appropriateness of language
8. Adaptability: Adjusting to different student needs

Provide:
- Specific strengths observed (with examples)
- Areas for improvement (with specific instances)
- Actionable suggestions for growth
- Overall score (weighted average, 1-100)
- Pass/Fail (passing score: 60/100)
- Recommendation for further practice

Be fair, constructive, and specific. Reference actual interactions from the session.`,
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private modelName: string = 'meta-llama/llama-3.3-70b-instruct:free';

  constructor(private configService: ConfigService) {
    this.initializeOpenRouter();
  }

  /**
   * Initialize OpenRouter client
   */
  private initializeOpenRouter(): void {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    this.modelName = this.configService.get<string>('OPENROUTER_MODEL') ?? 'meta-llama/llama-3.3-70b-instruct:free';
    const baseURL = this.configService.get<string>('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1';
    
    if (!apiKey) {
      this.logger.warn('OPENROUTER_API_KEY not set. AI features will be disabled.');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey,
        baseURL,
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/AkioCkist/teacher-ai',
          'X-Title': 'Teacher AI',
        }
      });
      this.logger.log(`OpenRouter AI initialized successfully with model ${this.modelName}`);
    } catch (error) {
      this.logger.error('Failed to initialize OpenRouter AI', error);
    }
  }

  /**
   * Ensure OpenRouter is initialized
   */
  private ensureInitialized(): void {
    if (!this.openai) {
      throw new AIServiceException('OpenRouter AI is not initialized. Please check OPENROUTER_API_KEY.');
    }
  }

  /**
   * Process lesson plan and prepare for simulation
   */
  async processLessonPlan(lessonContent: string, pdfBuffer?: Buffer): Promise<string> {
    this.ensureInitialized();

    try {
      const prompt = `${SYSTEM_PROMPTS.lessonUnderstanding}

Here is the lesson plan:

${lessonContent}

Please confirm your understanding of this lesson plan and your readiness to simulate an elementary school classroom.`;

      const userContent: any[] = [{ type: 'text', text: prompt }];

      if (pdfBuffer) {
        userContent.push({
          type: 'file',
          file: {
            filename: 'lesson_plan.pdf',
            file_data: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`
          }
        });
      }

      const response = await this.openai!.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'user', content: userContent as any }
        ],
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Failed to process lesson plan', error);
      throw new AIServiceException('Failed to process lesson plan');
    }
  }

  /**
   * Generate classroom simulation response
   */
  async generateClassroomResponse(
    conversationHistory: ConversationMessage[],
    teacherMessage: string,
    lessonContent?: string,
    pdfBuffer?: Buffer,
  ): Promise<string> {
    this.ensureInitialized();

    try {
      // Randomly select 2-4 students for this round
      const numStudents = Math.floor(Math.random() * 3) + 2; // 2-4 students
      const selectedStudents = this.selectRandomStudents(numStudents);

      const studentContext = selectedStudents
        .map(s => `- ${s.name} (${s.type}): ${s.description}`)
        .join('\n');

      const systemPrompt = `${SYSTEM_PROMPTS.classroomSimulation}

The following students are responding this round:
${studentContext}

Remember the conversation context and maintain consistency with previous student responses.`;

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt }
      ];

      const historyMessages = this.mapConversationHistory(conversationHistory);

      // If we have a PDF buffer, attach it directly to the very first user message to preserve OCR/formatting
      if (pdfBuffer) {
        if (historyMessages.length > 0) {
          const firstMsg = historyMessages[0];
          const textContent = typeof firstMsg.content === 'string' ? firstMsg.content : '';
          firstMsg.content = [
            { type: 'text', text: textContent },
            {
              type: 'file' as any,
              file: {
                filename: 'lesson_plan.pdf',
                file_data: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`
              }
            } as any
          ] as any;
        } else {
          // If there is no history, attach it to the current message
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: teacherMessage },
              {
                type: 'file' as any,
                file: {
                  filename: 'lesson_plan.pdf',
                  file_data: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`
                }
              } as any
            ] as any
          });
        }
      }

      if (pdfBuffer && historyMessages.length === 0) {
        // Message is already pushed
      } else {
        messages.push(...historyMessages);
        messages.push({ role: 'user', content: teacherMessage });
      }

      // If there is no PDF, fallback to injecting extracted text context in the system prompt
      if (!pdfBuffer && lessonContent) {
        messages[0].content = `${messages[0].content}\n\nHere is the lesson plan that the teacher is teaching:\n${lessonContent}`;
      }

      const response = await this.openai!.chat.completions.create({
        model: this.modelName,
        messages,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Failed to generate classroom response', error);
      throw new AIServiceException('Failed to generate classroom response');
    }
  }

  /**
   * Evaluate teaching performance
   */
  async evaluateTeaching(
    conversationHistory: ConversationMessage[],
    lessonContent: string,
    pdfBuffer?: Buffer,
  ): Promise<string> {
    this.ensureInitialized();

    try {
      const prompt = `Teaching Session Transcript:
${this.formatConversationHistory(conversationHistory)}

Please provide a comprehensive evaluation in JSON format with the following structure:
{
  "criteria": {
    "questioningTechniques": <1-10>,
    "scaffolding": <1-10>,
    "classroomManagement": <1-10>,
    "encouragement": <1-10>,
    "feedbackQuality": <1-10>,
    "pedagogicalReasoning": <1-10>,
    "communication": <1-10>,
    "adaptability": <1-10>
  },
  "overallScore": <1-100>,
  "passed": <true|false>,
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", ...],
  "recommendation": "<detailed recommendation for further practice>"
}`;

      const userContent: any[] = [{ type: 'text', text: prompt }];

      if (pdfBuffer) {
        userContent.push({
          type: 'file',
          file: {
            filename: 'lesson_plan.pdf',
            file_data: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`
          }
        });
      } else {
        userContent.push({ type: 'text', text: `Lesson Plan:\n${lessonContent}` });
      }

      const response = await this.openai!.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.evaluation },
          { role: 'user', content: userContent as any }
        ],
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Failed to evaluate teaching', error);
      throw new AIServiceException('Failed to evaluate teaching performance');
    }
  }

  /**
   * Select random students for this round
   */
  private selectRandomStudents(count: number): typeof STUDENT_PERSONALITIES {
    const shuffled = [...STUDENT_PERSONALITIES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Format conversation history for prompt
   */
  private formatConversationHistory(history: ConversationMessage[]): string {
    return history
      .map((msg) => {
        const role = msg.role === 'user' ? 'Teacher' : 'Students';
        const text = msg.parts.map((p) => p.text).join('\n');
        return `**${role}**: ${text}`;
      })
      .join('\n\n');
  }

  /**
   * Map database message history to OpenAI Chat format
   */
  private mapConversationHistory(history: ConversationMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    return history.map((msg) => {
      const role = msg.role === 'user' ? 'user' : 'assistant';
      const content = msg.parts.map((p) => p.text).join('\n');
      return { role, content };
    });
  }
}
