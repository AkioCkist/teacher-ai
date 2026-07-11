# Teacher AI - Virtual Classroom Simulator

A virtual classroom simulator that helps student teachers practice their pedagogical skills before entering a real classroom. Powered by Google Gemini AI.

## ⚠️ Important Notice

**Teacher AI is NOT a chatbot, NOT a RAG application, and NOT a document Q&A system.**

Teacher AI is a **virtual classroom simulator** where:
- The AI role-plays as multiple elementary school students with different personalities
- Student teachers practice their teaching skills
- The AI evaluates teaching performance based on pedagogical criteria

## Features

- 📚 Upload lesson plans (PDF, DOCX, PPTX)
- 🎓 Simulated classroom with diverse student personalities
- 💬 Real-time teaching practice with AI students
- 📊 Comprehensive teaching evaluation
- 🐳 Docker-first architecture

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- TailwindCSS
- React Router
- TanStack Query

### Backend
- NestJS
- TypeScript
- Google Gemini API

### Storage
- Local JSON files (no database required)

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Google Gemini API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/teacher-ai.git
cd teacher-ai
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_MODEL` is optional. If you leave it out, the backend falls back to `gemini-2.0-flash`.

4. Start the application:
```bash
docker compose up --build -d
```

5. Open your browser:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

6. For waitching log:
```bash
docker logs teacher-ai-backend -f
```

## Project Structure

```
teacher-ai/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── lib/        # API client and utilities
│   │   └── main.tsx    # Entry point
│   ├── package.json
│   └── Dockerfile
├── backend/            # NestJS backend
│   ├── src/
│   │   ├── app/        # App module
│   │   ├── modules/
│   │   │   ├── ai/     # Gemini integration
│   │   │   ├── chat/   # Chat/conversation
│   │   │   ├── evaluation/ # Teaching evaluation
│   │   │   ├── session/ # Session management
│   │   │   └── storage/ # File storage
│   │   └── common/     # Shared utilities
│   ├── package.json
│   └── Dockerfile
├── data/               # Local data storage
│   └── sessions/       # Session data
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/session | Upload lesson plan and create session |
| GET | /api/session/:sessionId | Get session metadata |
| POST | /api/chat/:sessionId | Send teacher message |
| GET | /api/history/:sessionId | Get conversation history |
| POST | /api/evaluate/:sessionId | Generate teaching evaluation |
| GET | /api/evaluations/:sessionId | Get evaluation history |

## Session Flow

1. **Upload Lesson Plan** - Upload a PDF, DOCX, or PPTX file containing your lesson plan
2. **AI Processes Lesson** - Gemini reads and understands the lesson objectives
3. **Teaching Simulation** - Interact with simulated students who respond based on their personalities
4. **Evaluation** - Request an evaluation of your teaching performance

## Student Personalities

The AI simulates various student types:
- Excellent students
- Good students
- Average students
- Struggling students
- Shy students
- Inattentive students
- Students with limited vocabulary
- Creative students
- And more...

## Development

### Without Docker

Backend:
```bash
cd backend
npm install
npm run start:dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Build for Production

```bash
docker compose -f docker-compose.yml build
```

## License

MIT License

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.
