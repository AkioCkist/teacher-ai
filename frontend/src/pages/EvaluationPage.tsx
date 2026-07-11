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
          Loading evaluation...
        </div>
      </div>
    )
  }

  if (!latestEvaluation) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          No Evaluation Found
        </h1>
        <p className="text-gray-600 mb-6">
          You haven't completed an evaluation for this session yet.
        </p>
        <Link
          to={`/session/${sessionId}`}
          className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          Return to Session
        </Link>
      </div>
    )
  }

  const scoreColor =
    latestEvaluation.overallScore >= 80
      ? 'text-green-600'
      : latestEvaluation.overallScore >= 60
        ? 'text-yellow-600'
        : 'text-red-600'

  const criteriaLabels: Record<string, string> = {
    questioningTechniques: 'Questioning Techniques',
    scaffolding: 'Scaffolding',
    classroomManagement: 'Classroom Management',
    encouragement: 'Encouragement',
    feedbackQuality: 'Feedback Quality',
    pedagogicalReasoning: 'Pedagogical Reasoning',
    communication: 'Communication',
    adaptability: 'Adaptability',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teaching Evaluation</h1>
          <p className="text-gray-500">Session: {sessionId}</p>
        </div>
        <div className="text-right">
          <div className={`text-5xl font-bold ${scoreColor}`}>
            {latestEvaluation.overallScore}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {latestEvaluation.passed ? '✓ Passed' : '✗ Not Passed'}
          </div>
        </div>
      </div>

      {/* Criteria Scores */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Criteria
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(latestEvaluation.criteria).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">
                    {criteriaLabels[key] || key}
                  </span>
                  <span className="font-medium">{value}/10</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${value * 10}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-green-900 mb-3">Strengths</h2>
        <ul className="space-y-2">
          {latestEvaluation.strengths.map((strength, index) => (
            <li key={index} className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-green-800">{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Weaknesses */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-red-900 mb-3">
          Areas for Improvement
        </h2>
        <ul className="space-y-2">
          {latestEvaluation.weaknesses.map((weakness, index) => (
            <li key={index} className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-red-800">{weakness}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Suggestions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Suggestions</h2>
        <ul className="space-y-2">
          {latestEvaluation.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-blue-800">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendation */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Recommendation
        </h2>
        <p className="text-gray-700 leading-relaxed">
          {latestEvaluation.recommendation}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          to={`/session/${sessionId}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back to Session
        </Link>
        <Link
          to="/upload"
          className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          Start New Session
        </Link>
      </div>
    </div>
  )
}
