import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarClock } from 'lucide-react'

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: ReactNode
}

function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <button
            type="button"
            onClick={() => navigate('/landing')}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <CalendarClock className="h-5 w-5 text-emerald-600" />
            AgendaBOT
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-emerald-600">Documento legal</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: {lastUpdated}</p>

        <div className="mt-8 space-y-1 text-[15px] leading-relaxed text-slate-700">{children}</div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-3xl px-6 text-sm text-slate-500">
          © {new Date().getFullYear()} AgendaBOT. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}

export default LegalLayout
