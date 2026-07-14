import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="max-w-lg mx-auto pt-16 pb-12 text-center">
        <h1 className="text-2xl font-semibold text-slate-800 mb-3">
          Chào mừng đến với Teacher AI
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Trình mô phỏng lớp học ảo giúp giáo viên tập sự rèn luyện kỹ năng
          sư phạm trước khi bước vào lớp học thực tế.
        </p>
      </div>

      <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-4 mb-10">
        <div className="bg-white border border-slate-200 p-5">
          <div className="w-9 h-9 bg-amber-50 flex items-center justify-center mb-3">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-800 mb-1.5">
            Teacher AI là gì?
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Trình mô phỏng lớp học ảo với học sinh tiểu học có nhiều tính cách,
            khả năng và hành vi học tập khác nhau.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-5">
          <div className="w-9 h-9 bg-amber-50 flex items-center justify-center mb-3">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-800 mb-1.5">
            Cách hoạt động
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Tải lên giáo án, bắt đầu dạy. AI mô phỏng phản hồi học sinh. Khi
            hoàn tất, yêu cầu đánh giá kết quả giảng dạy.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white border border-slate-200 p-6 mb-8">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          Hướng dẫn từng bước
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-600 flex items-center justify-center text-white text-[11px] font-semibold shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800">Tải lên giáo án</h3>
              <p className="text-sm text-slate-500">Tải lên file PDF, DOCX hoặc PPTX chứa giáo án.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-600 flex items-center justify-center text-white text-[11px] font-semibold shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800">Bắt đầu dạy</h3>
              <p className="text-sm text-slate-500">Tương tác với học sinh mô phỏng — các em trả lời dựa trên tính cách riêng.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-600 flex items-center justify-center text-white text-[11px] font-semibold shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800">Nhận đánh giá</h3>
              <p className="text-sm text-slate-500">Nhận phản hồi về kỹ thuật đặt câu hỏi, quản lý lớp học và kết quả giảng dạy.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto text-center">
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          Bắt đầu ngay
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
