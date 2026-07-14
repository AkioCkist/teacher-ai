import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getConversationHistory } from '../lib/api'

export default function HistoryPage() {
  const { sessionId } = useParams<{ sessionId: string }>()

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', sessionId],
    queryFn: () => getConversationHistory(sessionId!),
    enabled: !!sessionId,
  })

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-xs text-slate-400 animate-pulse-slow">đang tải...</span>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Lịch sử hội thoại</h1>
            <p className="text-xs text-slate-400 mt-0.5">Buổi dạy: {sessionId}</p>
          </div>
          <Link
            to={`/session/${sessionId}`}
            className="text-xs font-medium text-amber-600 hover:text-amber-700 uppercase tracking-[0.06em]"
          >
            ← Quay lại lớp học
          </Link>
        </div>

        {!conversation?.messages?.length ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-slate-400">Chưa có hội thoại</p>
            <p className="text-xs text-slate-300 mt-1">Bắt đầu dạy để xem lịch sử hội thoại tại đây.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 px-4 py-3 text-xs text-slate-500 space-y-0.5">
              <p>Tổng số tin nhắn: {conversation.messages.length}</p>
              <p>Bắt đầu: {new Date(conversation.createdAt).toLocaleString()}</p>
              <p>Cập nhật lần cuối: {new Date(conversation.updatedAt).toLocaleString()}</p>
            </div>

            <div className="space-y-3">
              {conversation.messages.map((msg, index) => (
                <div key={index} className={`border ${msg.role === 'user' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'} px-3.5 py-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-semibold ${msg.role === 'user' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {msg.role === 'user' ? 'T' : 'S'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {msg.role === 'user' ? 'Giáo viên' : 'Học sinh'}
                      </div>
                      <div className="text-[10px] text-slate-400">#{index + 1}</div>
                    </div>
                  </div>
                  <div className="pl-8">
                    <p className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed">
                      {msg.parts.map((part, i) => (
                        <span key={i}>{part.text}</span>
                      ))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
