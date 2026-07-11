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
          Loading history...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Conversation History
          </h1>
          <p className="text-gray-500">Session: {sessionId}</p>
        </div>
        <Link
          to={`/session/${sessionId}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back to Session
        </Link>
      </div>

      {!conversation?.messages?.length ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
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
            No Conversation Yet
          </h3>
          <p className="text-gray-500">
            Start teaching to see your conversation history here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Total messages: {conversation.messages.length}
            </p>
            <p className="text-sm text-gray-600">
              Started: {new Date(conversation.createdAt).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Last updated: {new Date(conversation.updatedAt).toLocaleString()}
            </p>
          </div>

          <div className="space-y-4">
            {conversation.messages.map((msg, index) => (
              <div
                key={index}
                className={`border border-gray-200 rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {msg.role === 'user' ? 'T' : 'S'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {msg.role === 'user' ? 'Teacher' : 'Students'}
                    </div>
                    <div className="text-xs text-gray-500">Message #{index + 1}</div>
                  </div>
                </div>
                <div className="pl-10">
                  <p className="whitespace-pre-wrap text-gray-700">
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
  )
}
