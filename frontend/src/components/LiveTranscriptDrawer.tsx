import type { ConversationHistory } from '../lib/api'

interface LiveTranscriptDrawerProps {
  isOpen: boolean
  onClose: () => void
  conversation?: ConversationHistory
  speakText: (text: string) => void
}

export default function LiveTranscriptDrawer({
  isOpen,
  onClose,
  conversation,
  speakText,
}: LiveTranscriptDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col text-slate-800 animate-in">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Nhật ký hội thoại lớp học</h2>
          <p className="text-[11px] text-slate-500">Xem lại chi tiết từng câu hỏi & phản hồi</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {!conversation?.messages?.length && (
          <div className="text-center text-xs text-slate-400 py-12">
            Chưa có lời đối thoại nào trong buổi dạy.
          </div>
        )}

        {conversation?.messages?.map((msg, index) => {
          const text = msg.parts.map(p => p.text).join('\n')
          const isTeacher = msg.role === 'user'

          return (
            <div
              key={index}
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isTeacher
                  ? 'bg-slate-800 border-slate-800 text-white ml-6 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-800 mr-6 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200/40">
                <span className={`font-semibold uppercase text-[10px] ${isTeacher ? 'text-amber-300' : 'text-amber-600'}`}>
                  {isTeacher ? 'Giáo viên' : 'Học sinh phản hồi'}
                </span>
                <button
                  onClick={() => speakText(text)}
                  className="text-slate-400 hover:text-amber-600 transition-colors"
                  title="Đọc to"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
              </div>
              <div className="whitespace-pre-wrap">{text}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
