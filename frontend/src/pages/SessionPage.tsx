import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSession,
  sendMessage,
  getConversationHistory,
  generateEvaluation,
  attachFileToChat,
  updatePersonalityTypes,
  PERSONALITY_TYPES,
} from '../lib/api'
import type { StudentResponse } from '../lib/api'
import PixiClassroomCanvas from '../classroom/PixiClassroomCanvas'
import type { StudentData } from '../classroom/Types'
import { getStudentDisplayName, normalizePersonalityType } from '../classroom/Types'
import ClassroomControls from '../components/ClassroomControls'
import MidClassSettingsModal from '../components/MidClassSettingsModal'
import LiveTranscriptDrawer from '../components/LiveTranscriptDrawer'

function parseStudentResponses(text: string): StudentResponse[] {
  if (!text) return []

  const trimmed = text.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('```json')) {
    try {
      const jsonStr = trimmed.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .map((s: any) => ({
            name: String(s.name || '').trim(),
            type: String(s.type || '').trim(),
            response: String(s.response || '').trim(),
          }))
          .filter(s => s.name && s.response)
      }
    } catch {
      // Fall through to markdown parser
    }
  }

  const blocks = text.split('---').filter(b => b.trim().length > 0)
  return blocks
    .map(block => {
      const b = block.trim()
      const colonIdx = b.indexOf(':')
      if (colonIdx < 0) return null
      const header = b.substring(0, colonIdx).trim()
      const response = b.substring(colonIdx + 1).trim()
      if (!header || !response) return null

      const headerMatch = header.match(/(.+?)\s*\((.+?)\)\s*$/)
      if (!headerMatch) return null

      return {
        name: headerMatch[1].replace(/[*\[\]]/g, '').trim(),
        type: headerMatch[2].trim(),
        response,
      }
    })
    .filter((s): s is StudentResponse => s !== null)
}

const TTS_API = 'http://localhost:3000/api/tts'
let ttsAudios: HTMLAudioElement[] = []

function stopTTS() {
  ttsAudios.forEach(a => {
    a.src = ''
    a.load()
  })
  ttsAudios = []
}

function speakText(text: string): HTMLAudioElement | null {
  if (!text.trim()) return null
  stopTTS()
  const url = `${TTS_API}?text=${encodeURIComponent(text.trim())}`
  const audio = new Audio(url)
  ttsAudios.push(audio)
  audio.onended = () => {
    ttsAudios = ttsAudios.filter(a => a !== audio)
  }
  audio.play().catch(e => console.warn('[TTS] Play error:', e))
  return audio
}

function speakQueue(texts: string[], onDone?: () => void) {
  if (!texts.length) {
    onDone?.()
    return
  }
  stopTTS()
  let i = 0
  const next = () => {
    if (i >= texts.length) {
      onDone?.()
      return
    }
    const url = `${TTS_API}?text=${encodeURIComponent(texts[i].trim())}`
    const audio = new Audio(url)
    ttsAudios.push(audio)
    audio.onended = () => {
      ttsAudios = ttsAudios.filter(a => a !== audio)
      i++
      setTimeout(next, 300)
    }
    audio.play().catch(() => {
      i++
      setTimeout(next, 100)
    })
  }
  next()
}

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const recognitionRef = useRef<any>(null)

  const [message, setMessage] = useState('')
  const [replyTarget, setReplyTarget] = useState<StudentData | null>(null)
  const [autoTTS, setAutoTTS] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    PERSONALITY_TYPES.map(t => t.type)
  )

  const [studentStates, setStudentStates] = useState<Record<string, Partial<StudentData>>>({})
  const [lastTeacherMessage, setLastTeacherMessage] = useState<string>('')
  const [lastStudentResponses, setLastStudentResponses] = useState<
    Array<{ name: string; type: string; response: string; resolvedType: string }>
  >([])

  const prevMsgCount = useRef(0)

  // Fetch session metadata
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  })

  // Fetch conversation history
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', sessionId],
    queryFn: () => getConversationHistory(sessionId!),
    enabled: !!sessionId,
  })

  // Sync selectedTypes when session data loads
  useEffect(() => {
    if (session?.personalityTypes?.length) {
      setSelectedTypes(session.personalityTypes)
    }
  }, [session?.personalityTypes])

  // Parse conversation to update student states & question board
  useEffect(() => {
    if (!conversation?.messages?.length) return

    const messages = conversation.messages
    // Find last user message for question board
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const text = messages[i].parts.map(p => p.text).join('\n')
        setLastTeacherMessage(text)
        break
      }
    }

    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === 'model') {
      const fullText = lastMsg.parts.map(p => p.text).join('\n')
      const parsedStudents = parseStudentResponses(fullText)

      // Normalize each parsed student: replace the AI-generated name with the
      // canonical classroom name from STUDENT_NAME_POOL so both the response cards
      // and the classroom avatars always display the SAME student name.
      const normalizedStudents = parsedStudents.map(st => {
        const norm = normalizePersonalityType(st.type)
        const matchPt = PERSONALITY_TYPES.find(
          pt => pt.type === norm || pt.label.toLowerCase() === st.type.toLowerCase()
        )
        const resolvedType = matchPt ? matchPt.type : st.type
        // Pass no customName so getStudentDisplayName returns the canonical pool name
        const canonicalName = getStudentDisplayName(resolvedType)
        return { name: canonicalName, type: st.type, response: st.response, resolvedType }
      })

      setLastStudentResponses(normalizedStudents)

      const updatedStates: Record<string, Partial<StudentData>> = {}
      normalizedStudents.forEach(st => {
        updatedStates[st.resolvedType] = {
          name: st.name,
          isSpeaking: true,
          isHandRaised: true,
          lastResponse: st.response,
        }
      })
      setStudentStates(updatedStates)

      // Auto-TTS trigger
      if (autoTTS && conversation.messages.length > prevMsgCount.current && normalizedStudents.length > 0) {
        speakQueue(normalizedStudents.map(s => `${s.name} nói: ${s.response}`))
      }
    } else {
      setStudentStates({})
    }

    prevMsgCount.current = conversation.messages.length
  }, [conversation?.messages, autoTTS])

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: ({ msg, replyTo }: { msg: string; replyTo?: string }) =>
      sendMessage(sessionId!, msg, replyTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] })
      setMessage('')
      setReplyTarget(null)
    },
  })

  const fileUploadMutation = useMutation({
    mutationFn: ({ file, msg }: { file: File; msg?: string }) =>
      attachFileToChat(sessionId!, file, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] })
      setUploading(false)
    },
    onError: () => setUploading(false),
  })

  const evaluationMutation = useMutation({
    mutationFn: () => generateEvaluation(sessionId!),
    onSuccess: () => {
      navigate(`/evaluation/${sessionId}`)
    },
  })

  const personalityMutation = useMutation({
    mutationFn: (types: string[]) => updatePersonalityTypes(sessionId!, types),
    onSuccess: (updatedSession) => {
      if (updatedSession.personalityTypes?.length) {
        setSelectedTypes(updatedSession.personalityTypes)
      }
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      setShowSettings(false)
      // Force page reload to apply fresh seating layout smoothly
      window.location.reload()
    },
  })

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({
        msg: message.trim(),
        replyTo: replyTarget ? replyTarget.name : undefined,
      })
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    fileUploadMutation.mutate({ file, msg: message.trim() || undefined })
    e.target.value = ''
  }

  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Trình duyệt không hỗ trợ nhập liệu bằng giọng nói. Vui lòng dùng Chrome hoặc Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'vi-VN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setMessage(transcript)
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setIsListening(false)
    }

    recognition.onerror = () => {
      recognitionRef.current = null
      setIsListening(false)
    }

    recognitionRef.current = recognition
    setIsListening(true)
    recognition.start()
  }, [isListening])

  const handleSelectStudentFromCanvas = (student: StudentData) => {
    setReplyTarget(student)
  }

  const handleSelectReplyFromCard = (studentName: string, type: string) => {
    // studentName is already the canonical classroom name (from STUDENT_NAME_POOL)
    const norm = normalizePersonalityType(type)
    const matchPt = PERSONALITY_TYPES.find(
      pt => pt.type === norm || pt.label.toLowerCase() === type.toLowerCase()
    )
    const id = matchPt ? matchPt.type : type

    setReplyTarget({
      id,
      name: studentName, // already canonical — no need to re-derive
      type: id,
      label: matchPt ? matchPt.label : type,
      color: (matchPt ? matchPt.color : 'amber') as any,
      deskIndex: 0,
      isSpeaking: false,
      isHandRaised: false,
      isSelected: true,
      avatarStyle: {
        skinColor: 0xffdbac,
        hairColor: 0x2c1608,
        hairStyle: 'short',
        shirtColor: 0x3b82f6,
        glasses: false,
      },
    })
  }

  const isLoading = sessionLoading || conversationLoading

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 text-slate-400">
        <span className="text-xs animate-pulse font-medium">Đang kết nối vào phòng học 2D...</span>
      </div>
    )
  }

  const chalkboardTitle = session?.lessonFile
    ? `GIÁO ÁN: ${session.lessonFile.toUpperCase()}`
    : 'LỚP HỌC MÔ PHỎNG VIRTUAL CLASS'

  return (
    <div className="h-full w-full relative flex flex-col bg-slate-50 overflow-hidden select-none">
      {/* Top Navbar Header */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/sessions" className="text-slate-500 hover:text-amber-600 text-xs font-medium transition-colors">
            ← Danh sách bài dạy
          </Link>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-600 font-semibold">Buổi dạy: {sessionId}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
            Đang giảng dạy ({selectedTypes.length} học sinh)
          </span>
        </div>
      </div>

      {/* Main 2D Classroom Stage Container */}
      <div className="flex-1 w-full relative min-h-0">
        <PixiClassroomCanvas
          activeTypes={selectedTypes}
          studentStates={studentStates}
          selectedStudentName={replyTarget ? replyTarget.name : null}
          chalkboardTitle={chalkboardTitle}
          onSelectStudent={handleSelectStudentFromCanvas}
        />
      </div>

      {/* Bottom Floating Control Toolbar */}
      <ClassroomControls
        message={message}
        setMessage={setMessage}
        replyTarget={replyTarget}
        setReplyTarget={setReplyTarget}
        autoTTS={autoTTS}
        setAutoTTS={setAutoTTS}
        isListening={isListening}
        handleVoiceInput={handleVoiceInput}
        handleSubmit={handleSubmit}
        handleFileSelect={handleFileSelect}
        isPending={sendMessageMutation.isPending}
        uploading={uploading}
        onToggleSettings={() => setShowSettings(true)}
        onToggleDrawer={() => setShowDrawer(true)}
        onGenerateEvaluation={() => evaluationMutation.mutate()}
        isEvaluating={evaluationMutation.isPending}
        hasMessages={!!conversation?.messages?.length}
        lastTeacherMessage={lastTeacherMessage}
        lastStudentResponses={lastStudentResponses}
        onSelectReplyFromCard={handleSelectReplyFromCard}
        speakText={speakText}
      />

      {/* Mid-class settings modal */}
      <MidClassSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        onSave={() => personalityMutation.mutate(selectedTypes)}
        isPending={personalityMutation.isPending}
      />

      {/* Live transcript side drawer */}
      <LiveTranscriptDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        conversation={conversation}
        speakText={speakText}
      />
    </div>
  )
}
