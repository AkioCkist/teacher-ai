import { useRef } from 'react'
import type { StudentData } from '../classroom/Types'
import { getPersonalityLabel } from '../classroom/Types'

interface ClassroomControlsProps {
  message: string
  setMessage: (msg: string) => void
  replyTarget: StudentData | null
  setReplyTarget: (target: StudentData | null) => void
  autoTTS: boolean
  setAutoTTS: (val: boolean) => void
  isListening: boolean
  handleVoiceInput: () => void
  handleSubmit: (e: React.FormEvent) => void
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  isPending: boolean
  uploading: boolean
  onToggleSettings: () => void
  onToggleDrawer: () => void
  onGenerateEvaluation: () => void
  isEvaluating: boolean
  hasMessages: boolean
  lastTeacherMessage?: string
  lastStudentResponses?: Array<{ name: string; type: string; response: string }>
  onSelectReplyFromCard?: (studentName: string, type: string) => void
  speakText?: (text: string) => void
}

export default function ClassroomControls({
  message,
  setMessage,
  replyTarget,
  setReplyTarget,
  autoTTS,
  setAutoTTS,
  isListening,
  handleVoiceInput,
  handleSubmit,
  handleFileSelect,
  isPending,
  uploading,
  onToggleSettings,
  onToggleDrawer,
  onGenerateEvaluation,
  isEvaluating,
  hasMessages,
  lastTeacherMessage,
  lastStudentResponses,
  onSelectReplyFromCard,
  speakText,
}: ClassroomControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (message.trim() && !isPending) {
        handleSubmit(e)
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-7xl mx-auto px-4 pb-3 select-none z-20">
      {/* 1. Interactive Cards Container for Latest Student Responses with direct Reply button */}
      {lastStudentResponses && lastStudentResponses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 animate-in">
          {lastStudentResponses.map((st, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 shadow-md rounded-xl p-2.5 flex flex-col justify-between min-w-0"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 truncate">{st.name}</span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium shrink-0">
                      {getPersonalityLabel(st.type)}
                    </span>
                  </div>
                  {speakText && (
                    <button
                      type="button"
                      onClick={() => speakText(st.response)}
                      className="text-slate-400 hover:text-amber-600 p-0.5 transition-colors"
                      title="Đọc to"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-3 italic">
                  "{st.response}"
                </p>
              </div>

              <div className="pt-2 mt-1 border-t border-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => onSelectReplyFromCard?.(st.name, st.type)}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Trả lời riêng em này
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Teacher Question Board overlay */}
      {lastTeacherMessage && (
        <div className="bg-white border border-amber-200 shadow-sm rounded-xl p-2.5 flex items-start gap-2.5 animate-in">
          <div className="bg-amber-100 text-amber-800 text-[11px] font-semibold uppercase px-2 py-0.5 rounded shrink-0 mt-0.5">
            Câu hỏi vừa đặt
          </div>
          <div className="text-xs text-slate-800 font-medium leading-relaxed flex-1">
            {lastTeacherMessage}
          </div>
        </div>
      )}

      {/* Target student banner if direct reply active */}
      {replyTarget && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-1.5 text-xs animate-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-800">Đang chọn phản hồi riêng:</span>
            <span className="bg-amber-600 text-white px-2 py-0.5 rounded-md font-medium text-[11px]">
              {replyTarget.name}
            </span>
          </div>
          <button
            onClick={() => setReplyTarget(null)}
            className="text-amber-700 hover:text-amber-900 font-semibold text-xs"
          >
            ✕ Hủy chọn
          </button>
        </div>
      )}

      {/* Main command bar (White + Amber Minimalist Theme) */}
      <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
            disabled={isPending || uploading}
            className="p-2.5 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-all disabled:opacity-40"
            title="Đính kèm bài giảng"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                replyTarget
                  ? `Nhập phản hồi riêng cho ${replyTarget.name}...`
                  : 'Đặt câu hỏi hoặc giảng bài cho cả lớp...'
              }
              rows={1}
              disabled={isPending}
              className="w-full bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl px-3.5 py-2 outline-none focus:border-amber-500 focus:bg-white resize-none transition-all"
              style={{ maxHeight: '90px' }}
            />
          </div>

          {/* Mic / Voice Input button */}
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-slate-500 hover:text-amber-600 hover:bg-slate-100'
            }`}
            title={isListening ? 'Dừng thu âm' : 'Nói vào micro'}
          >
            {isListening ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a4 4 0 00-4 4v3a4 4 0 008 0V8a4 4 0 00-4-4z" />
              </svg>
            )}
          </button>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!message.trim() || isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-xs font-medium uppercase tracking-wider disabled:opacity-40 transition-all shadow-sm"
          >
            {isPending ? 'Đang gửi...' : 'Nói'}
          </button>
        </form>

        {/* Toolbar Footer */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
              <span>Tự đọc TTS:</span>
              <input
                type="checkbox"
                checked={autoTTS}
                onChange={e => setAutoTTS(e.target.checked)}
                className="accent-amber-600 rounded cursor-pointer w-4 h-4"
              />
            </label>
            <button
              type="button"
              onClick={onToggleSettings}
              className="flex items-center gap-1 hover:text-amber-600 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cấu hình sỉ số
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleDrawer}
              className="hover:text-amber-600 font-medium transition-colors"
            >
              Nhật ký hội thoại
            </button>
            <button
              type="button"
              onClick={onGenerateEvaluation}
              disabled={isEvaluating || !hasMessages}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg text-xs font-medium disabled:opacity-40 transition-all shadow-sm"
            >
              {isEvaluating ? 'Đang đánh giá...' : 'Đánh giá tiết dạy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
