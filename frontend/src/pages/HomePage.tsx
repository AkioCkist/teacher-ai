import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Chào mừng đến với Teacher AI
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Trình mô phỏng lớp học ảo giúp giáo viên tập sự rèn luyện kỹ năng
          sư phạm trước khi bước vào lớp học thực tế.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Teacher AI là gì?
          </h2>
          <p className="text-gray-600">
            Teacher AI là trình mô phỏng lớp học ảo mô phỏng các tương tác
            thực tế trong lớp học với học sinh tiểu học có nhiều tính cách,
            khả năng và hành vi học tập khác nhau.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cách hoạt động
          </h2>
          <p className="text-gray-600">
            Tải lên giáo án của bạn, sau đó bắt đầu dạy. AI sẽ mô phỏng phản
            hồi của học sinh dựa trên câu hỏi và cách giảng dạy của bạn. Khi
            hoàn tất, hãy yêu cầu đánh giá kết quả giảng dạy của bạn.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Hướng dẫn từng bước
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Tải lên giáo án</h3>
              <p className="text-gray-600">
                Tải lên file PDF, DOCX hoặc PPTX chứa giáo án của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Bắt đầu dạy</h3>
              <p className="text-gray-600">
                Tương tác với học sinh mô phỏng — các em trả lời dựa trên tính cách
                riêng và cách giảng dạy của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Nhận đánh giá</h3>
              <p className="text-gray-600">
                Nhận phản hồi về kỹ thuật đặt câu hỏi, quản lý lớp học và kết
                quả giảng dạy tổng thể.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          Bắt đầu ngay
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
