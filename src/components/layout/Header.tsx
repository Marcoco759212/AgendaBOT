import { Bell, ChevronDown, MoonStar, Sparkles, SunMedium } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiRequest } from '../../lib/api'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'

function Header() {
  const { tenants, activeTenantId, setActiveTenant, setTheme, theme, user, logout } = useAppStore()
  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false)
  const [whatsappStatus, setWhatsappStatus] = useState<{ connected: boolean; state: 'open' | 'close' | 'connecting' | 'not_configured'; instance_name: string | null } | null>(null)
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0]
  const isDark = theme === 'dark'
  const initials = (user.name || 'User').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!activeTenantId) {
      setWhatsappStatus(null)
      return
    }

    const fetchStatus = async () => {
      try {
        const response = await apiRequest<{ connected: boolean; state: 'open' | 'close' | 'connecting' | 'not_configured'; instance_name: string | null }>('/api/business/whatsapp/status', { method: 'GET' }, { tenant_id: activeTenantId })
        setWhatsappStatus(response)
      } catch {
        setWhatsappStatus({ connected: false, state: 'not_configured', instance_name: null })
      }
    }

    void fetchStatus()
  }, [activeTenantId])

  const whatsappBadge = whatsappStatus?.connected
    ? { label: 'Bot WhatsApp Activo', tone: 'success', dot: 'bg-emerald-400' }
    : whatsappStatus?.state === 'not_configured'
      ? { label: 'Bot WhatsApp no conectado', tone: 'alert', dot: 'bg-rose-400' }
      : { label: 'Bot WhatsApp pendiente', tone: 'warning', dot: 'bg-amber-400' }

  return (
    <header className={isDark ? 'sticky top-0 z-20 border-b border-slate-700/80 bg-slate-950/80 backdrop-blur-xl' : 'sticky top-0 z-20 border-b border-slate-300 bg-white/80 backdrop-blur-xl'}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <button className={isDark ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-slate-900 text-slate-100' : 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-slate-700'}>
              ☰
            </button>
          </div>

          <div className="relative">
            <label className={isDark ? 'mb-1 pl-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400' : 'mb-1 pl-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500'}>Tenant</label>
            <div className={isDark ? 'relative rounded-2xl border border-slate-600 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 shadow-[0_10px_25px_rgba(15,23,42,0.22)]' : 'relative rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-emerald-50 shadow-[0_12px_26px_rgba(15,23,42,0.06)]'}>
              <button
                type="button"
                onClick={() => setIsTenantMenuOpen((open) => !open)}
                className={isDark ? 'flex w-[220px] items-center justify-between gap-3 bg-transparent px-3 py-2.5 pr-10 text-left text-sm font-medium text-white outline-none ring-0 ' : 'flex w-[220px] items-center justify-between gap-3 bg-transparent px-3 py-2.5 pr-10 text-left text-sm font-medium text-slate-800 outline-none ring-0'}
              >
                <span className="truncate">{activeTenant?.name || 'Selecciona tenant'}</span>
              </button>

              <div className={isDark ? 'pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center rounded-r-2xl border-l border-slate-600 bg-slate-800/90 px-3' : 'pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center rounded-r-2xl border-l border-slate-200 bg-white/70 px-3'}>
                <ChevronDown className={isDark ? 'h-4 w-4 text-slate-300' : 'h-4 w-4 text-slate-600'} />
              </div>

              {isTenantMenuOpen && (
                <div className={isDark ? 'absolute left-0 top-full z-30 mt-2 w-[220px] overflow-hidden rounded-xl border border-slate-600 bg-slate-900 shadow-[0_18px_45px_rgba(2,6,23,0.55)]' : 'absolute left-0 top-full z-30 mt-2 w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]'}>
                  {tenants.map((tenant) => (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => {
                        setActiveTenant(tenant.id)
                        setIsTenantMenuOpen(false)
                      }}
                      className={isDark
                        ? `flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium transition-colors ${activeTenantId === tenant.id ? 'bg-violet-500/15 text-violet-200' : 'text-slate-200 hover:bg-slate-800'}`
                        : `flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium transition-colors ${activeTenantId === tenant.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span className="truncate">{tenant.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={whatsappBadge.tone === 'success'
          ? (isDark ? 'hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 md:flex' : 'hidden items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-2 md:flex')
          : whatsappBadge.tone === 'warning'
            ? (isDark ? 'hidden items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 md:flex' : 'hidden items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-2 md:flex')
            : (isDark ? 'hidden items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-2 md:flex' : 'hidden items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-3 py-2 md:flex')
        }>
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', whatsappBadge.tone === 'success' ? 'bg-emerald-500' : whatsappBadge.tone === 'warning' ? 'bg-amber-500' : 'bg-rose-500')} />
            <span className={cn('relative inline-flex h-2 w-2 rounded-full', whatsappBadge.dot)} />
          </div>
          <Sparkles className={whatsappBadge.tone === 'success' ? 'h-3.5 w-3.5 text-emerald-200' : whatsappBadge.tone === 'warning' ? 'h-3.5 w-3.5 text-amber-200' : 'h-3.5 w-3.5 text-rose-200'} />
          <span className={whatsappBadge.tone === 'success'
            ? (isDark ? 'text-xs font-medium text-emerald-100' : 'text-xs font-medium text-emerald-700')
            : whatsappBadge.tone === 'warning'
              ? (isDark ? 'text-xs font-medium text-amber-100' : 'text-xs font-medium text-amber-700')
              : (isDark ? 'text-xs font-medium text-rose-100' : 'text-xs font-medium text-rose-700')
          }>{whatsappBadge.label}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={isDark ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-slate-900 text-slate-100' : 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-slate-700'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
          <button className={isDark ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-100' : 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700'}>
            <Bell className="h-4 w-4" />
          </button>

          <div className={isDark ? 'flex items-center gap-3 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2' : 'flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2'}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-violet-500 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className={isDark ? 'text-sm font-medium text-white' : 'text-sm font-medium text-slate-800'}>{user.name}</p>
              <p className={isDark ? 'text-[11px] text-slate-400' : 'text-[11px] text-slate-500'}>{user.role}</p>
            </div>
            <button type="button" onClick={logout} className={isDark ? 'ml-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-300' : 'ml-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-600'}>
              Salir
            </button>
          </div>
        </div>
      </div>

      <div className={isDark ? 'border-t border-slate-700/80 px-4 py-3 text-xs text-slate-400 lg:px-6' : 'border-t border-slate-300 px-4 py-3 text-xs text-slate-500 lg:px-6'}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className={isDark ? 'font-medium text-slate-300' : 'font-medium text-slate-700'}>{activeTenant.name}</span>
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}> • {activeTenant.city}</span>
          </div>
          <div className={activeTenant.calendarLinked
            ? (isDark ? 'rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300' : 'rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-700')
            : (isDark ? 'rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-300' : 'rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-700')
          }>
            {activeTenant.calendarLinked ? 'Calendar Vinculado' : 'Calendar No Vinculado'}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
