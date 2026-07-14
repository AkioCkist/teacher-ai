import { Outlet, Link, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="h-9 px-3 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
        <Link to="/" className="flex items-center gap-1.5">
          <img
            src="/icon.svg"
            alt="Virtual Class"
            className="h-7 w-7"
          />
          <span className="text-[11px] font-semibold text-slate-800">Virtual Class</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className={`text-[11px] font-medium uppercase tracking-[0.08em] ${
              location.pathname === '/'
                ? 'text-amber-600'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Trang chủ
          </Link>
          <Link
            to="/upload"
            className={`text-[11px] font-medium uppercase tracking-[0.08em] ${
              location.pathname === '/upload'
                ? 'text-amber-600'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Tải giáo án
          </Link>
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
