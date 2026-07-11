import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
**[Student Name]** ([personality type]):
[Student's response in Vietnamese, appropriate for their personality]
---

Personalities to choose from:
- Excellent student: Gives correct, detailed answers
- Good student: Participates actively, mostly correct
- Average student: Sometimes struggles, tries hard
- Weak student: Needs guidance and support
- Shy student: Speaks quietly, hesitantly
- Inattentive student: Easily distracted, off-topic
- Understands but can't express: Knows the concept, struggles to articulate
- Limited vocabulary: Uses simple, basic words
- Confidently wrong: Gives incorrect answers confidently
- Random guesser: Guesses without thinking
- Creative student: Unique, imaginative responses
- Quiet student: Rarely volunteers, gives short answers

Make the classroom feel REAL - students interrupt each other, ask questions, show enthusiasm or boredom.

Remember: You are SIMULATING a classroom, NOT providing answers as an AI assistant.`,

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
  private genAI: GoogleGenerativeAI | null = null;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

  constructor(private configService: ConfigService) {
    this.initializeGemini();
  }

  /**
   * Initialize Gemini client
   */
  private initializeGemini(): void {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set. AI features will be disabled.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.logger.log('Gemini AI initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Gemini AI', error);
    }
  }

  /**
   * Ensure Gemini is initialized
   */
  private ensureInitialized(): void {
    if (!this.model) {
      throw new AIServiceException('Gemini AI is not initialized. Please check GEMINI_API_KEY.');
    }
  }

  /**
   * Process lesson plan and prepare for simulation
   */
  async processLessonPlan(lessonContent: string): Promise<string> {
    this.ensureInitialized();

    try {
      const prompt = `${SYSTEM_PROMPTS.lessonUnderstanding}

Here is the lesson plan:

${lessonContent}

Please confirm your understanding of this lesson plan and your readiness to simulate an elementary school classroom.`;

      const result = await this.model!.generateContent(prompt);
      const response = await result.response;
      return response.text();
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
  ): Promise<string> {
    this.ensureInitialized();

    try {
      // Randomly select 2-4 students for this round
      const numStudents = Math.floor(Math.random() * 3) + 2; // 2-4 students
      const selectedStudents = this.selectRandomStudents(numStudents);

      const studentContext = selectedStudents
        .map(s => `- ${s.name} (${s.type}): ${s.description}`)
        .join('\n');

      const prompt = `${SYSTEM_PROMPTS.classroomSimulation}

The following students are responding this round:
${studentContext}

Remember the conversation context and maintain consistency with previous student responses.

Conversation history:
${this.formatConversationHistory(conversationHistory)}

Teacher's latest message:
${teacherMessage}

Now respond as these ${numStudents} students. Use Vietnamese appropriate for elementary school level.`;

      const result = await this.model!.generateContent(prompt);
      const response = await result.response;
      return response.text();
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
  ): Promise<string> {
    this.ensureInitialized();

    try {
      const prompt = `${SYSTEM_PROMPTS.evaluation}

Lesson Plan:
${lessonContent}

Teaching Session Transcript:
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

      const result = await this.model!.generateContent(prompt);
      const response = await result.response;
      return response.text();
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
}
