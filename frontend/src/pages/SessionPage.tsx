import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSession, sendMessage, getConversationHistory, generateEvaluation, attachFileToChat } from '../lib/api'
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
  }
  return map[normalizeType(type)] || type
}

function personalityBadgeColor(type: string): string {
  const goodTypes = ['excellent', 'good']
  const midTypes = ['average', 'creative', 'understands_cant_express']
  const enType = normalizeType(type)
  if (goodTypes.includes(enType)) return 'bg-green-100 text-green-800'
  if (midTypes.includes(enType)) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
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
  const [message, setMessage] = useState('')
  const [replyTarget, setReplyTarget] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [autoTTS, setAutoTTS] = useState(false)
  const [uploading, setUploading] = useState(false)
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

  // TTS for textarea content
  const handleReadAloud = useCallback(() => {
    if (message.trim()) speakText(message.trim())
  }, [message])

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

  const isLoading = sessionLoading || conversationLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-600">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Đang tải lớp học...
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lớp học</h1>
          <p className="text-sm text-gray-500">
            Mã buổi: {sessionId} • Trạng thái: {session?.status || 'Đang tải...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto TTS toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-gray-600">Tự đọc</span>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${
                autoTTS ? 'bg-primary-500' : 'bg-gray-300'
              }`}
              onClick={() => setAutoTTS(!autoTTS)}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  autoTTS ? 'translate-x-5' : ''
                }`}
              />
            </div>
          </label>
          <Link
            to={`/history/${sessionId}`}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Xem lịch sử
          </Link>
          <button
            onClick={() => evaluationMutation.mutate()}
            disabled={evaluationMutation.isPending || !conversation?.messages?.length}
            className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {evaluationMutation.isPending ? 'Đang đánh giá...' : 'Nhận đánh giá'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2">
        {conversation?.messages?.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sẵn sàng bắt đầu dạy
            </h3>
            <p className="text-gray-500">
              Hãy đặt câu hỏi đầu tiên cho lớp học để bắt đầu buổi dạy.
            </p>
          </div>
        )}

        {conversation?.messages?.map((msg, index) => {
          if (msg.role === 'user') {
            // Teacher message — render as bubble
            return (
              <div key={index} className="flex justify-end animate-fade-in">
                <div className="max-w-[80%] bg-primary-500 text-white rounded-lg p-4">
                  <div className="text-sm font-medium mb-1 opacity-75">Giáo viên</div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.parts.map((part, i) => (
                      <span key={i}>
                        {part.text.split(/\*\*(.*?)\*\*/g).map((segment, j) =>
                          j % 2 === 1 ? (
                            <strong key={j} className="font-semibold">
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

          // AI / model message — parse into student cards
          const fullText = msg.parts.map(p => p.text).join('\n')
          const students = parseStudentResponses(fullText)

          // Fallback: if no parseable students, show raw text
          if (students.length === 0) {
            return (
              <div key={index} className="flex justify-start animate-fade-in">
                <div className="max-w-[80%] bg-gray-100 text-gray-900 rounded-lg p-4">
                  <div className="text-sm font-medium mb-1 opacity-75">Lớp học</div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.parts.map((part, i) => (
                      <span key={i}>
                        {part.text.split(/\*\*(.*?)\*\*/g).map((segment, j) =>
                          j % 2 === 1 ? (
                            <strong key={j} className="font-semibold">
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

          // Render each student as a separate card
          return (
            <div key={index} className="space-y-3">
              {students.map((student, si) => (
                <div
                  key={si}
                  className="flex justify-start animate-fade-in"
                  style={{ animationDelay: `${si * 80}ms` }}
                >
                  <div className="max-w-[85%] w-full">
                    {/* Student card */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      {/* Card header — name + personality */}
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {student.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${personalityBadgeColor(
                              student.type
                            )}`}
                          >
                            {personalityLabel(student.type)}
                          </span>
                        </div>
                        {/* TTS button for each student */}
                        <button
                          onClick={() => speakText(student.response)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Đọc to"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        </button>
                      </div>

                      {/* Response text */}
                      <div className="px-4 py-3">
                        <div className="whitespace-pre-wrap leading-relaxed text-gray-800 text-sm">
                          {student.response.split(/\*\*(.*?)\*\*/g).map((segment, j) =>
                            j % 2 === 1 ? (
                              <strong key={j} className="font-semibold">
                                {segment}
                              </strong>
                            ) : (
                              <span key={j}>{segment}</span>
                            )
                          )}
                        </div>
                      </div>

                      {/* Reply section */}
                      <div className="border-t border-gray-100">
                        {replyTarget === student.name ? (
                          <div className="p-3 bg-gray-50">
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
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                              disabled={sendMessageMutation.isPending}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setReplyTarget(null)
                                  setReplyText('')
                                }}
                                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium"
                                disabled={sendMessageMutation.isPending}
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleReplySubmit(student.name)}
                                disabled={
                                  !replyText.trim() || sendMessageMutation.isPending
                                }
                                className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                              >
                                {sendMessageMutation.isPending
                                  ? 'Đang gửi...'
                                  : 'Gửi phản hồi'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReplyTarget(
                                replyTarget === student.name ? null : student.name
                              )
                              setReplyText('')
                            }}
                            className="w-full px-4 py-2 text-left text-xs text-gray-500 hover:text-primary-600 hover:bg-gray-50 font-medium transition-colors flex items-center gap-1.5"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                              />
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
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-gray-500 text-sm">
                  Học sinh đang trả lời...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Uploading indicator */}
        {uploading && (
          <div className="flex justify-end animate-fade-in">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[60%]">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang tải file lên...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Main input */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Đặt câu hỏi cho học sinh... (Enter để gửi, Shift+Enter để xuống dòng)"
            rows={1}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none overflow-hidden"
            style={{ minHeight: '48px', maxHeight: '160px' }}
            disabled={sendMessageMutation.isPending}
            onInput={e => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 160) + 'px'
            }}
          />
        </div>
        {/* File upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sendMessageMutation.isPending || uploading}
          className="px-3 py-3 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Đính kèm tài liệu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        {/* Read aloud button */}
        <button
          type="button"
          onClick={handleReadAloud}
          disabled={!message.trim()}
          className="px-3 py-3 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Đọc to"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={!message.trim() || sendMessageMutation.isPending}
          className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
        >
          Gửi
        </button>
      </form>

      {evaluationMutation.isError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">
            {evaluationMutation.error instanceof Error
              ? evaluationMutation.error.message
              : 'Không thể tạo đánh giá. Vui lòng thử lại.'}
          </p>
        </div>
      )}
    </div>
  )
}
