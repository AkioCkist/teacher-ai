import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { AIServiceException } from '../../common/exceptions/app.exception';
import { ConversationMessage, ActiveStudent, ParsedStudentResponse } from '../../common/interfaces/session.interface';

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
  // New expanded types
  { name: 'An', type: 'curious', description: 'a curious student who constantly asks questions and wants to know more' },
  { name: 'Khoa', type: 'competitive', description: 'a competitive student who always wants to answer first and win' },
  { name: 'Quỳnh', type: 'careless', description: 'a careless student who often makes simple mistakes in answers' },
  { name: 'Linh', type: 'leader', description: 'a natural leader who summarizes others answers and keeps class organized' },
  { name: 'Bảo', type: 'visual', description: 'a visual learner who uses drawings and metaphors to explain ideas' },
  { name: 'Trang', type: 'slow_learner', description: 'a slow learner who needs repetition and extra time to understand' },
  { name: 'Tú', type: 'perfectionist', description: 'a perfectionist who fears mistakes and hesitates to speak up' },
  { name: 'Vy', type: 'humorous', description: 'a humorous student who makes jokes and lightens the mood' },
];

/**
 * System prompts for different stages
 */
const SYSTEM_PROMPTS = {
  lessonUnderstanding: `Bạn là trợ lý AI giúp giáo viên tập sự chuẩn bị cho buổi thực hành giảng dạy.
Nhiệm vụ của bạn là đọc và hiểu giáo án do giáo viên cung cấp.

Bạn cần:
1. Xác định mục tiêu bài học và kết quả đầu ra
2. Hiểu các khái niệm chính cần giảng dạy
3. Ghi nhận câu trả lời mong đợi và đáp án của học sinh
4. Hiểu các hoạt động trong lớp đã được lên kế hoạch
5. Chuẩn bị để mô phỏng học sinh tiểu học

Sau khi đọc giáo án, hãy xác nhận bạn đã hiểu và sẵn sàng mô phỏng lớp học tiểu học.

QUAN TRỌNG: Bạn KHÔNG phải chatbot hay trợ lý giảng dạy. Bạn là trình mô phỏng lớp học.
Phản hồi của bạn nên xác nhận đã hiểu bài học và sẵn sàng bắt đầu mô phỏng.`,

  classroomSimulation: `You are a VIRTUAL CLASSROOM SIMULATOR, NOT a chatbot or teaching assistant.

Your job is to role-play MULTIPLE elementary school students in a Vietnamese classroom.

CRITICAL LANGUAGE RULE: ALL student responses MUST be written in clean, natural Vietnamese (Tiếng Việt). Do NOT mix in any other language, random characters, or foreign words unless quoting a specific vocabulary term from the lesson.

SỐ LƯỢNG HỌC SINH TRẢ LỜI (QUAN TRỌNG):
- Nếu câu hỏi/yêu cầu của giáo viên KHÔNG nhắc đến số lượng → trả lời với 2-4 học sinh như bình thường
- Nếu giáo viên yêu cầu "một bạn", "một người", "một học sinh", hoặc chỉ miêu tả đặc điểm của một loại học sinh (vd: "bạn mắc lỗi chính tả", "bạn nhút nhát") mà không nói rõ số nhiều → CHỈ trả lời với ĐÚNG 1 học sinh phù hợp nhất với miêu tả đó
- Nếu giáo viên yêu cầu "hai bạn", "một vài bạn", hoặc số cụ thể → trả lời với ĐÚNG số lượng đó
- Luôn luôn chọn học sinh phù hợp nhất với đặc điểm giáo viên yêu cầu

Ví dụ:
- "Hãy trả lời" → 2-4 học sinh
- "Một bạn mắc lỗi chính tả trả lời nào" → CHỈ 1 học sinh (VD: Mai hoặc Hùng)
- "Bạn nhút nhát trả lời" → CHỈ 1 học sinh (Nam - shy)
- "Bạn nào có câu trả lời sáng tạo?" → CHỈ 1 học sinh (Phong - creative)

IMPORTANT RULES:
1. NEVER answer as an AI assistant or chatbot
2. Each student should have a distinct name, personality, and way of speaking
3. Students should respond naturally as real elementary school children would
4. Mix correct, partially correct, and incorrect answers (when 2+ students)
5. Some students may ask clarifying questions
6. Students may be enthusiastic, hesitant, confused, or distracted

For each teacher question or prompt, provide responses from the currently active students.

CRITICAL — You MUST respond with ONLY valid JSON. No markdown, no code blocks, no extra text before or after. The JSON must be parsable by JSON.parse().

Example JSON format (multiple students):
[
  { "name": "Minh", "type": "excellent", "response": "Câu trả lời bằng tiếng Việt..." },
  { "name": "Lan", "type": "good", "response": "Câu trả lời bằng tiếng Việt..." }
]

Example JSON format (single student - when teacher requests one):
[
  { "name": "Mai", "type": "weak", "response": "Em đoá thấy chú chó có lông trăng..." }
]

Rules:
- "name": MUST match one of the student names listed above exactly
- "type": MUST use the English type key
- "response": Student answer in Vietnamese, matching their personality
- Số lượng học sinh linh hoạt theo yêu cầu của giáo viên (mặc định 2-4, ít hơn nếu được yêu cầu)
- Output NOTHING except the JSON array — no greetings, no explanations

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
- Học sinh tò mò: Hay đặt câu hỏi "tại sao" và muốn khám phá thêm
- Học sinh cạnh tranh: Luôn muốn trả lời trước và giành điểm
- Học sinh ẩu: Thường mắc lỗi cơ bản do thiếu cẩn thận
- Học sinh nhóm trưởng: Biết tổng kết và điều phối câu trả lời
- Học sinh trực quan: Thích vẽ, dùng hình ảnh và so sánh để giải thích
- Học sinh chậm hiểu: Cần nhắc lại và thêm thời gian để nắm bài
- Học sinh cầu toàn: Sợ sai nên ngại phát biểu, hay do dự
- Học sinh hài hước: Hay pha trò, làm lớp cười, thêm không khí vui vẻ

Hãy khiến lớp học thật SỐNG ĐỘNG - học sinh ngắt lời nhau, đặt câu hỏi, thể hiện hứng thú hoặc buồn chán.

Ghi nhớ: Bạn đang MÔ PHỎNG lớp học, KHÔNG phải trả lời với tư cách AI trợ lý.`,

  evaluation: `Bạn là một giảng viên sư phạm giàu kinh nghiệm đang đánh giá kết quả giảng dạy thực hành của một giáo viên tập sự sử dụng phương pháp đàm thoại gợi mở.

Hãy đánh giá giáo viên dựa trên tương tác của họ với học sinh mô phỏng trong suốt buổi dạy.

Đánh giá theo các tiêu chí sau (thang điểm 1-10):

--- NHÓM 1: KHẢ NĂNG TỔ CHỨC PHƯƠNG PHÁP ĐÀM THOẠI GỢI MỞ ---

1. baoQuatCaTheHoa — Tính bao quát và cá thể hóa:
- Đặt câu hỏi cho toàn lớp rồi mới chỉ định học sinh trả lời
- Sau khi học sinh trả lời, yêu cầu học sinh khác nhận xét, bổ sung, sửa chữa
- Thu hút sự chú ý lắng nghe và đánh giá mức độ nhận thức, khả năng phản biện

2. tinhKheoLeo — Tính khéo léo:
- Khi học sinh gặp câu hỏi khó, khéo léo gợi ý bằng câu hỏi gợi mở đơn giản hơn
- Nếu trả lời không đầy đủ, yêu cầu học sinh khác bổ sung ý kiến

3. tinhKienNhan — Tính kiên nhẫn:
- Tạo không khí thoải mái, không tạo áp lực
- Dành thời gian đủ dài để học sinh suy nghĩ trước khi trả lời
- Thái độ bình tĩnh khi học sinh trả lời sai hoặc thiếu chính xác
- Không nôn nóng, vội vàng cắt ngang ý học sinh
- Uốn nắn, bổ sung câu trả lời, giúp hệ thống hoá tri thức

4. tinhLinhHoat — Tính linh hoạt:
- Khuyến khích học sinh mạnh dạn nêu thắc mắc
- Khéo léo sử dụng thắc mắc để tạo tình huống có vấn đề
- Thu hút toàn lớp tham gia thảo luận, tranh luận
- Góp phần lấp lỗ hổng, chữa sai lầm hoặc hiểu chưa chính xác

5. tichHopKyNangNgonNgu — Tích hợp kỹ năng sử dụng ngôn ngữ:
- Nhắc nhở, yêu cầu diễn đạt rõ ràng, trong sáng, dễ hiểu, âm lượng đủ to
- Gợi ý sửa chữa khi mắc lỗi dùng từ, diễn đạt, biểu cảm
- Động viên học sinh tự tin trình bày suy nghĩ

--- NHÓM 2: HỆ THỐNG CÂU HỎI CỦA GIÁO VIÊN ---

6. tinhMucDich — Tính mục đích:
- Câu hỏi bám sát mục tiêu bài học
- Phục vụ rõ ràng việc kiểm tra bài cũ, truyền thụ kiến thức mới, hay củng cố bài

7. tinhTuDuy — Tính tư duy:
- Câu hỏi có tính gợi mở
- Học sinh không chỉ nhớ lại kiến thức (tái hiện) mà còn giải thích hoặc giải quyết tình huống thực tế (phát hiện, sáng tạo)

8. tinhVuaSuc — Tính vừa sức:
- Ngôn từ phù hợp với lứa tuổi tiểu học
- Chia nhỏ câu hỏi phức tạp thành câu đơn giản để học sinh dễ theo dõi

9. tinhRoRang — Tính rõ ràng:
- Câu hỏi ngắn gọn, dễ hiểu
- Không đa nghĩa, không hỏi nhiều vấn đề cùng lúc
- Tránh gợi ý đáp án quá lộ liễu, không trả lời thay cho học sinh

Cung cấp:
- Điểm mạnh cụ thể (kèm ví dụ từ buổi dạy)
- Điểm cần cải thiện (kèm tình huống cụ thể)
- Gợi ý hành động để phát triển
- Điểm tổng thể (trung bình có trọng số, 1-100)
- Đạt/Không đạt (điểm đạt: 60/100)
- Đề xuất cho việc luyện tập thêm

Hãy công bằng, mang tính xây dựng và cụ thể. Dẫn chiếu các tương tác thực tế trong buổi dạy.

CRITICAL: You MUST respond with valid JSON only, using the EXACT key names above (e.g. "baoQuatCaTheHoa", "tinhKheoLeo", etc.). No markdown, no code blocks.`,
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private modelName: string = 'google/gemini-2.0-flash-exp:free';

  constructor(private configService: ConfigService) {
    this.initializeOpenRouter();
  }

  /**
   * Initialize OpenRouter client
   */
  private initializeOpenRouter(): void {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    this.modelName = this.configService.get<string>('OPENROUTER_MODEL') ?? 'google/gemini-2.0-flash-exp:free';
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
          'X-Title': 'Virtual Class',
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
    activeStudents?: ActiveStudent[],
    replyToStudent?: string,
    allowedTypes?: string[],
  ): Promise<{ rawResponse: string; parsedStudents: ParsedStudentResponse[]; activeStudents: ActiveStudent[] }> {
    this.ensureInitialized();

    try {
      // Use existing roster or select 4 students on first call (filtered by allowedTypes)
      const roster: ActiveStudent[] = activeStudents?.length
        ? activeStudents
        : this.selectRandomStudents(4, allowedTypes);

      const studentContext = roster
        .map(s => `- ${s.name} (${s.type}): ${s.description}`)
        .join('\n');

      let systemPrompt = `${SYSTEM_PROMPTS.classroomSimulation}

Các học sinh đang tham gia trả lời:
${studentContext}

Giữ tính cách nhất quán với các câu trả lời trước.`;

      if (replyToStudent) {
        systemPrompt += `\n\nQUAN TRỌNG: Giáo viên đang phản hồi RIÊNG cho [@${replyToStudent}]. CHỈ một mình ${replyToStudent} trả lời tin nhắn này. Các học sinh khác KHÔNG được trả lời. Output JSON array với CHỈ 1 học sinh duy nhất: ${replyToStudent}.`;
      }

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

      const rawResponse = response.choices[0]?.message?.content || '';
      const parsedStudents = this.parseStudentResponses(rawResponse);

      return { rawResponse, parsedStudents, activeStudents: roster };
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

Please provide a comprehensive evaluation in JSON format with the following structure — use the EXACT key names as shown:
{
  "criteria": {
    "baoQuatCaTheHoa": <1-10>,
    "tinhKheoLeo": <1-10>,
    "tinhKienNhan": <1-10>,
    "tinhLinhHoat": <1-10>,
    "tichHopKyNangNgonNgu": <1-10>,
    "tinhMucDich": <1-10>,
    "tinhTuDuy": <1-10>,
    "tinhVuaSuc": <1-10>,
    "tinhRoRang": <1-10>
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
  private selectRandomStudents(count: number, allowedTypes?: string[]): ActiveStudent[] {
    let pool = STUDENT_PERSONALITIES;
    if (allowedTypes && allowedTypes.length > 0) {
      pool = STUDENT_PERSONALITIES.filter(s => allowedTypes.includes(s.type));
    }
    // Fallback to all if filter yields nothing
    if (pool.length === 0) pool = STUDENT_PERSONALITIES;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, pool.length));
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
    // Keep last 6 exchanges to prevent context overflow
    const recent = history.slice(-12);
    return recent.map((msg) => {
      const role = msg.role === 'user' ? 'user' : 'assistant';
      const content = msg.parts.map((p) => p.text).join('\n');
      return { role, content };
    });
  }

  /**
   * Parse AI response into structured student response objects.
   * Tries JSON first (new format), then falls back to markdown (legacy).
   */
  private parseStudentResponses(rawText: string): ParsedStudentResponse[] {
    if (!rawText) return [];

    // Try JSON parse first
    const trimmed = rawText.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('```json')) {
      try {
        const jsonStr = trimmed.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .map((s: any) => ({
              name: String(s.name || '').trim(),
              type: String(s.type || '').trim(),
              response: String(s.response || '').trim(),
            }))
            .filter(s => s.name && s.response);
        }
      } catch {
        // Fall through to markdown parser
      }
    }

    // Fallback: parse markdown format (legacy)
    const blocks = rawText.split('---').filter(b => b.trim().length > 0);
    return blocks.map(block => {
      const b = block.trim();
      const colonIdx = b.indexOf(':');
      if (colonIdx < 0) return null;

      const header = b.substring(0, colonIdx).trim();
      const response = b.substring(colonIdx + 1).trim();
      if (!header || !response) return null;

      const headerMatch = header.match(/(.+?)\s*\((.+?)\)\s*$/);
      if (!headerMatch) return null;

      return {
        name: headerMatch[1].replace(/[*\[\]]/g, '').trim(),
        type: headerMatch[2].trim(),
        response,
      };
    }).filter((s): s is ParsedStudentResponse => s !== null);
  }
}
