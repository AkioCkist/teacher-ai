import { Outlet, Link, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-primary-500 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TA</span>
              </div>
              <span className="font-semibold text-lg text-gray-900">
                Teacher AI
              </span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link to="/" className={linkClass('/')}>
                Trang chủ
              </Link>
              <Link to="/upload" className={linkClass('/upload')}>
                Tải giáo án
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Teacher AI - Trình mô phỏng lớp học ảo cho giáo viên tập sự
          </p>
        </div>
      </footer>
    </div>
  )
}
