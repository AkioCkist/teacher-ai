import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEvaluationHistory } from '../lib/api'

export default function EvaluationPage() {
  const { sessionId } = useParams<{ sessionId: string }>()

  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['evaluations', sessionId],
    queryFn: () => getEvaluationHistory(sessionId!),
    enabled: !!sessionId,
  })

  const latestEvaluation = evaluations?.evaluations?.[0]

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-xs text-slate-400 animate-pulse-slow">đang tải...</span>
      </div>
    )
  }

  if (!latestEvaluation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <p className="text-sm text-slate-400 mb-4">Không tìm thấy đánh giá</p>
        <p className="text-xs text-slate-300 mb-6">Chưa hoàn thành đánh giá cho buổi dạy này.</p>
        <Link
          to={`/session/${sessionId}`}
          className="text-xs font-medium text-amber-600 hover:text-amber-700 uppercase tracking-[0.06em]"
        >
          ← Quay lại lớp học
        </Link>
      </div>
    )
  }

  const scoreColor =
    latestEvaluation.overallScore >= 80
      ? 'text-emerald-600'
      : latestEvaluation.overallScore >= 60
        ? 'text-amber-600'
        : 'text-rose-600'

  const criteriaLabels: Record<string, string> = {
    questioningTechniques: 'Kỹ thuật đặt câu hỏi',
    scaffolding: 'Hỗ trợ học sinh',
    classroomManagement: 'Quản lý lớp học',
    encouragement: 'Khuyến khích học sinh',
    feedbackQuality: 'Chất lượng phản hồi',
    pedagogicalReasoning: 'Lý luận sư phạm',
    communication: 'Giao tiếp',
    adaptability: 'Linh hoạt thích ứng',
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Đánh giá buổi dạy</h1>
            <p className="text-xs text-slate-400 mt-0.5">Buổi dạy: {sessionId}</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${scoreColor}`}>
              {latestEvaluation.overallScore}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {latestEvaluation.passed ? 'Đạt' : 'Chưa đạt'}
            </div>
          </div>
        </div>

        {/* Criteria */}
        <div className="bg-white border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Tiêu chí đánh giá</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(latestEvaluation.criteria).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600 truncate">{criteriaLabels[key] || key}</span>
                    <span className="font-medium text-slate-700 shrink-0 ml-2">{value}/10</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${value * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div className="border border-emerald-200 bg-emerald-50 p-4 mb-3">
          <h2 className="text-sm font-semibold text-emerald-800 mb-2">Điểm mạnh</h2>
          <ul className="space-y-1.5">
            {latestEvaluation.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-emerald-700">
                <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="border border-rose-200 bg-rose-50 p-4 mb-3">
          <h2 className="text-sm font-semibold text-rose-800 mb-2">Điểm cần cải thiện</h2>
          <ul className="space-y-1.5">
            {latestEvaluation.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-rose-700">
                <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestions */}
        <div className="border border-sky-200 bg-sky-50 p-4 mb-3">
          <h2 className="text-sm font-semibold text-sky-800 mb-2">Gợi ý cải thiện</h2>
          <ul className="space-y-1.5">
            {latestEvaluation.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-sky-700">
                <svg className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendation */}
        <div className="bg-white border border-slate-200 p-4 mb-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">Đề xuất</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {latestEvaluation.recommendation}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            to={`/session/${sessionId}`}
            className="text-xs font-medium text-amber-600 hover:text-amber-700 uppercase tracking-[0.06em]"
          >
            ← Quay lại lớp học
          </Link>
          <Link
            to="/upload"
            className="bg-amber-600 text-white px-4 py-2 text-xs font-medium hover:bg-amber-700 transition-colors uppercase tracking-[0.06em]"
          >
            Buổi dạy mới
          </Link>
        </div>
      </div>
    </div>
  )
}
