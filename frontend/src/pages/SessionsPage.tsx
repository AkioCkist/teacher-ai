import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listSessions } from '../lib/api'

export default function SessionsPage() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: listSessions,
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
        <h1 className="text-lg font-semibold text-slate-800 mb-1">Lịch sử hội thoại</h1>
        <p className="text-sm text-slate-500 mb-6">Các buổi dạy đã thực hiện.</p>

        {!sessions?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-slate-400">Chưa có buổi dạy nào</p>
            <p className="text-xs text-slate-300 mt-1">Tải lên giáo án để bắt đầu buổi dạy đầu tiên.</p>
            <Link
              to="/upload"
              className="mt-4 text-xs font-medium text-amber-600 hover:text-amber-700 uppercase tracking-[0.06em]"
            >
              Tải giáo án →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(session => (
              <Link
                key={session.id}
                to={`/session/${session.id}`}
                className="block bg-white border border-slate-200 px-4 py-3 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-800">Buổi {session.id}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {new Date(session.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <span className={`text-[10px] font-medium uppercase tracking-[0.06em] ${
                    session.status === 'IN_PROGRESS' ? 'text-amber-600' :
                    session.status === 'COMPLETED' ? 'text-emerald-600' :
                    session.status === 'READY' ? 'text-slate-400' :
                    'text-rose-600'
                  }`}>
                    {session.status === 'IN_PROGRESS' ? 'Đang dạy' :
                     session.status === 'COMPLETED' ? 'Hoàn tất' :
                     session.status === 'READY' ? 'Sẵn sàng' : 'Lỗi'}
                  </span>
                </div>
                {session.lessonFile && (
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    File: {session.lessonFile}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
