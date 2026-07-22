import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSession, sendMessage, getConversationHistory, generateEvaluation, attachFileToChat, updatePersonalityTypes, PERSONALITY_TYPES } from '../lib/api'
import type { StudentResponse } from '../lib/api'

/**
 * Parse AI markdown into structured student responses
 */
function parseStudentResponses(text: string): StudentResponse[] {
  if (!text) return []

  // Try JSON parse first (new format)
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

  // Fallback: parse markdown format (legacy)
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

/**
 * Get Vietnamese label for personality type
 */
const VI_TO_EN: Record<string, string> = {
  'giỏi': 'excellent',
  'khá': 'good',
  'trung bình': 'average',
  'yếu': 'weak',
  'nhút nhát': 'shy',
  'mất tập trung': 'inattentive',
  'hiểu nhưng khó diễn đạt': 'understands_cant_express',
  'vốn từ hạn chế': 'limited_vocabulary',
  'tự tin nhưng sai': 'confidently_wrong',
  'đoán mò': 'random_guess',
  'sáng tạo': 'creative',
  'im lặng': 'quiet',
  'hiệu quả': 'excellent',
  'tò mò': 'curious',
  'cạnh tranh': 'competitive',
  'ẩu': 'careless',
  'nhóm trưởng': 'leader',
  'trực quan': 'visual',
  'chậm hiểu': 'slow_learner',
  'cầu toàn': 'perfectionist',
  'hài hước': 'humorous',
}

function normalizeType(type: string): string {
  const lower = type.toLowerCase()
  return VI_TO_EN[lower] || type
}

function personalityLabel(type: string): string {
  const map: Record<string, string> = {
    excellent: 'Giỏi',
    good: 'Khá',
    average: 'Trung bình',
    weak: 'Yếu',
    shy: 'Nhút nhát',
    inattentive: 'Mất tập trung',
    understands_cant_express: 'Hiểu nhưng khó diễn đạt',
    limited_vocabulary: 'Vốn từ hạn chế',
    confidently_wrong: 'Tự tin nhưng sai',
    random_guess: 'Đoán mò',
    creative: 'Sáng tạo',
    quiet: 'Im lặng',
    curious: 'Tò mò',
    competitive: 'Cạnh tranh',
    careless: 'Ẩu',
    leader: 'Nhóm trưởng',
    visual: 'Trực quan',
    slow_learner: 'Chậm hiểu',
    perfectionist: 'Cầu toàn',
    humorous: 'Hài hước',
  }
  return map[normalizeType(type)] || type
}

function personalityBadgeColor(type: string): string {
  const goodTypes = ['excellent', 'good', 'leader']
  const midTypes = ['average', 'creative', 'understands_cant_express', 'curious', 'visual', 'humorous']
  const enType = normalizeType(type)
  if (goodTypes.includes(enType)) return 'bg-emerald-50 text-emerald-700'
  if (midTypes.includes(enType)) return 'bg-amber-50 text-amber-700'
  return 'bg-rose-50 text-rose-700'
}

/** Backend TTS endpoint */
const TTS_API = 'http://localhost:3000/api/tts'
let ttsAudios: HTMLAudioElement[] = []

/** Stop all playing TTS audio */
function stopTTS() {
  ttsAudios.forEach(a => { a.src = ''; a.load() })
  ttsAudios = []
}

/** Speak text using backend VoiceRSS proxy. */
function speakText(text: string): HTMLAudioElement | null {
  if (!text.trim()) return null
  stopTTS()
  const url = `${TTS_API}?text=${encodeURIComponent(text.trim())}`
  const audio = new Audio(url)
  ttsAudios.push(audio)
  audio.onended = () => { ttsAudios = ttsAudios.filter(a => a !== audio) }
  audio.play().catch(e => console.warn('[TTS] Play error:', e))
  return audio
}

/** Queue multiple texts, speak sequentially via backend TTS. */
function speakQueue(texts: string[], onDone?: () => void) {
  if (!texts.length) { onDone?.(); return }
  stopTTS()
  let i = 0
  const next = () => {
    if (i >= texts.length) { onDone?.(); return }
    const url = `${TTS_API}?text=${encodeURIComponent(texts[i].trim())}`
    const audio = new Audio(url)
    ttsAudios.push(audio)
    audio.onended = () => {
      ttsAudios = ttsAudios.filter(a => a !== audio)
      i++; setTimeout(next, 300)
    }
    audio.play().catch(() => { i++; setTimeout(next, 100) })
  }
  next()
}


export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const [message, setMessage] = useState('')
  const [replyTarget, setReplyTarget] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [autoTTS, setAutoTTS] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(PERSONALITY_TYPES.map(t => t.type))
  const prevMsgCount = useRef(0)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  // Fetch session data
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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({
      msg,
      replyTo,
    }: {
      msg: string
      replyTo?: string
    }) => sendMessage(sessionId!, msg, replyTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] })
      setMessage('')
      setReplyTarget(null)
      setReplyText('')
    },
  })

  // File upload mutation
  const fileUploadMutation = useMutation({
    mutationFn: ({ file, msg }: { file: File; msg?: string }) =>
      attachFileToChat(sessionId!, file, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] })
      setUploading(false)
    },
    onError: () => setUploading(false),
  })

  // Auto-TTS: speak new student responses when toggle on
  useEffect(() => {
    if (!autoTTS || !conversation?.messages?.length) return
    const msgs = conversation.messages
    if (msgs.length <= prevMsgCount.current) { prevMsgCount.current = msgs.length; return }

    // New messages arrived — find student responses in last model message
    const lastMsg = msgs[msgs.length - 1]
    if (lastMsg.role !== 'model') return

    const fullText = lastMsg.parts.map(p => p.text).join('\n')
    const students = parseStudentResponses(fullText)
    if (students.length > 0) {
      speakQueue(students.map(s => `${s.name} nói: ${s.response}`))
    }

    prevMsgCount.current = msgs.length
  }, [conversation?.messages?.length, autoTTS])

  // Handle main input submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({ msg: message.trim() })
    }
  }

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    fileUploadMutation.mutate({ file, msg: message.trim() || undefined })
    e.target.value = ''
  }

  // Handle reply submit to a specific student
  const handleReplySubmit = (studentName: string) => {
    if (replyText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({
        msg: replyText.trim(),
        replyTo: studentName,
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (message.trim() && !sendMessageMutation.isPending) {
        sendMessageMutation.mutate({ msg: message.trim() })
      }
    }
  }

  // Speech-to-text: browser mic → fill textarea
  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Trình duyệt không hỗ trợ nhập liệu bằng giọng nói. Vui lòng dùng Chrome hoặc Edge.')
      return
    }

    // Stop if already listening
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])

  // Focus reply textarea when replyTarget changes
  useEffect(() => {
    if (replyTarget && replyRef.current) {
      replyRef.current.focus()
    }
  }, [replyTarget])

  // Generate evaluation mutation
  const evaluationMutation = useMutation({
    mutationFn: () => generateEvaluation(sessionId!),
    onSuccess: () => {
      navigate(`/evaluation/${sessionId}`)
    },
  })

  // Persist personality types
  const personalityMutation = useMutation({
    mutationFn: (types: string[]) => updatePersonalityTypes(sessionId!, types),
  })

  const isLoading = sessionLoading || conversationLoading

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-xs text-slate-400 animate-pulse-slow">đang tải...</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Session header bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm font-semibold text-slate-800 shrink-0">Lớp học</h1>
          <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
            • {sessionId}
          </span>
          {session?.status && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              • {session.status === 'IN_PROGRESS' ? 'Đang dạy' : session.status === 'COMPLETED' ? 'Hoàn tất' : session.status === 'READY' ? 'Sẵn sàng' : session.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
            <span className="text-[11px] font-medium text-slate-400">Tự đọc</span>
            <div
              className={`relative w-7 h-3.5 rounded-sm transition-colors cursor-pointer ${
                autoTTS ? 'bg-amber-500' : 'bg-slate-200'
              }`}
              onClick={() => setAutoTTS(!autoTTS)}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white transition-transform ${
                  autoTTS ? 'translate-x-3.5' : ''
                }`}
              />
            </div>
          </label>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 transition-colors ${showSettings ? 'text-amber-600' : 'text-slate-400 hover:text-slate-700'}`}
            title="Cài đặt học sinh"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <Link
            to={`/history/${sessionId}`}
            className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 uppercase tracking-[0.06em]"
          >
            Lịch sử
          </Link>
          <button
            onClick={() => evaluationMutation.mutate()}
            disabled={evaluationMutation.isPending || !conversation?.messages?.length}
            className="px-2 py-1 text-[11px] font-medium text-amber-600 hover:text-amber-700 uppercase tracking-[0.06em] disabled:text-slate-300 disabled:cursor-not-allowed"
          >
            {evaluationMutation.isPending ? 'Đang đánh giá...' : 'Đánh giá'}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 shrink-0">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-[0.06em]">Tính cách học sinh</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{selectedTypes.length}/{PERSONALITY_TYPES.length}</span>
                <button
                  type="button"
                  onClick={() => {
                    const all = selectedTypes.length === PERSONALITY_TYPES.length
                    setSelectedTypes(all ? [] : PERSONALITY_TYPES.map(t => t.type))
                  }}
                  className="text-[10px] font-medium text-amber-600 hover:text-amber-700 uppercase tracking-[0.06em]"
                >
                  {selectedTypes.length === PERSONALITY_TYPES.length ? 'Bỏ chọn' : 'Chọn tất cả'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PERSONALITY_TYPES.map(pt => {
                const sel = selectedTypes.includes(pt.type)
                const bgColor = pt.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  pt.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                return (
                  <button
                    key={pt.type}
                    type="button"
                    onClick={() => {
                      setSelectedTypes(prev =>
                        prev.includes(pt.type) ? prev.filter(t => t !== pt.type) : [...prev, pt.type]
                      )
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium border transition-colors ${
                      sel ? bgColor : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {sel && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {pt.label}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => {
                  personalityMutation.mutate(selectedTypes)
                  setShowSettings(false)
                }}
                disabled={personalityMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
              >
                {personalityMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {conversation?.messages?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-xs text-slate-300 font-medium tracking-[0.02em]">
              Bắt đầu bằng một câu hỏi
            </p>
          </div>
        )}

        {conversation?.messages?.map((msg, index) => {
          if (msg.role === 'user') {
            // Teacher message
            const teacherText = msg.parts.map(p => p.text).join('\n')
            return (
              <div key={index} className="flex justify-end animate-in">
                <div className="max-w-[70%] bg-slate-800 text-white text-sm leading-relaxed">
                  <div className="flex items-center justify-between px-3.5 pt-2.5">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.06em]">Giáo viên</span>
                    <button
                      onClick={() => speakText(teacherText)}
                      className="p-0.5 text-white/100 hover:text-amber-300 transition-colors"
                      title="Đọc to"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap px-3.5 pb-2.5">
                    {msg.parts.map((part, i) => (
                      <span key={i}>
                        {part.text.split(/\*\*(.*?)\*\*/g).map((segment, j) =>
                          j % 2 === 1 ? (
                            <strong key={j} className="font-semibold text-amber-300">
                              {segment}
                            </strong>
                          ) : (
                            <span key={j}>{segment}</span>
                          )
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          // AI / model message
          const fullText = msg.parts.map(p => p.text).join('\n')
          const students = parseStudentResponses(fullText)

          // Fallback: show raw text
          if (students.length === 0) {
            return (
              <div key={index} className="flex justify-start animate-in">
                <div className="max-w-[70%] bg-white border border-slate-200 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700">
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.06em] mb-1">Lớp học</div>
                  {msg.parts.map((part, i) => (
                    <span key={i}>
                      {part.text.split(/\*\*(.*?)\*\*/g).map((segment, j) =>
                        j % 2 === 1 ? (
                          <strong key={j} className="font-semibold text-slate-800">
                            {segment}
                          </strong>
                        ) : (
                          <span key={j}>{segment}</span>
                        )
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )
          }

          // Render each student as card
          return (
            <div key={index} className="space-y-2">
              {students.map((student, si) => (
                <div key={si} className="flex justify-start animate-in">
                  <div className="max-w-[85%] w-full">
                    <div className="bg-white border border-slate-200">
                      {/* Card header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-500 text-[11px] font-semibold shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-800 truncate">
                            {student.name}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 font-medium leading-none shrink-0 ${personalityBadgeColor(student.type)}`}>
                            {personalityLabel(student.type)}
                          </span>
                        </div>
                        <button
                          onClick={() => speakText(student.response)}
                          className="p-1 text-slate-400 hover:text-amber-600 transition-colors shrink-0"
                          title="Đọc to"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        </button>
                      </div>

                      {/* Response */}
                      <div className="px-3 py-2.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {student.response.split(/\*\*(.*?)\*\*/g).map((segment, j) =>
                          j % 2 === 1 ? (
                            <strong key={j} className="font-semibold text-slate-800">
                              {segment}
                            </strong>
                          ) : (
                            <span key={j}>{segment}</span>
                          )
                        )}
                      </div>

                      {/* Reply section */}
                      <div className="border-t border-slate-100">
                        {replyTarget === student.name ? (
                          <div className="px-3 py-2 bg-slate-50">
                            <textarea
                              ref={replyRef}
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleReplySubmit(student.name)
                                }
                              }}
                              placeholder={`Phản hồi ${student.name}...`}
                              rows={1}
                              className="w-full px-2.5 py-1.5 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 resize-none outline-none focus:border-amber-500 bg-white overflow-hidden"
                              disabled={sendMessageMutation.isPending}
                              onInput={e => {
                                const target = e.target as HTMLTextAreaElement
                                target.style.height = 'auto'
                                target.style.height = Math.min(target.scrollHeight, 160) + 'px'
                              }}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setReplyTarget(null)
                                  setReplyText('')
                                }}
                                className="text-[11px] font-medium text-slate-400 hover:text-slate-600 uppercase tracking-[0.06em]"
                                disabled={sendMessageMutation.isPending}
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleReplySubmit(student.name)}
                                disabled={!replyText.trim() || sendMessageMutation.isPending}
                                className="text-[11px] font-medium text-amber-600 hover:text-amber-700 uppercase tracking-[0.06em] disabled:text-slate-300 disabled:cursor-not-allowed"
                              >
                                {sendMessageMutation.isPending ? 'Đang gửi...' : 'Gửi'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReplyTarget(replyTarget === student.name ? null : student.name)
                              setReplyText('')
                            }}
                            className="w-full px-3 py-1.5 text-left text-[11px] font-medium text-slate-400 hover:text-amber-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Phản hồi {student.name}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        {sendMessageMutation.isPending && (
          <div className="flex animate-in">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse-slow" />
              học sinh đang trả lời...
            </div>
          </div>
        )}

        {uploading && (
          <div className="flex animate-in">
            <span className="text-[11px] text-slate-400 px-1">đang tải file...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Command bar */}
      <form onSubmit={handleSubmit} className="shrink-0">
        <div className="border-t border-slate-200 bg-white px-3">
          <div className="flex items-center gap-2 py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendMessageMutation.isPending || uploading}
              className="shrink-0 p-1 text-slate-400 hover:text-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Đính kèm tài liệu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <span className="text-sm text-amber-600 font-semibold shrink-0 select-none">❯</span>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Đặt câu hỏi cho học sinh..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none border-0 resize-none py-1 leading-normal"
              style={{ maxHeight: '120px' }}
              disabled={sendMessageMutation.isPending}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`shrink-0 p-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening ? 'text-red-500' : 'text-slate-400 hover:text-amber-600'
              }`}
              title={isListening ? 'Nhấn để dừng' : 'Nhập liệu bằng giọng nói'}
            >
              {isListening ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a4 4 0 00-4 4v3a4 4 0 008 0V8a4 4 0 00-4-4z" />
                </svg>
              )}
            </button>
            <button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 uppercase tracking-[0.08em] disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Gửi
            </button>
          </div>
        </div>
      </form>

      {evaluationMutation.isError && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 shrink-0">
          <p className="text-red-600 text-xs">
            {evaluationMutation.error instanceof Error
              ? evaluationMutation.error.message
              : 'Không thể tạo đánh giá. Vui lòng thử lại.'}
          </p>
        </div>
      )}
    </div>
  )
}
