import { BarChart3, Building2, CalendarDays, Settings2, Users, WalletCards } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import { cn } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'
import type { ViewName } from '../types'

const navigation = [
  { key: 'dashboard', label: 'Analítica y Dashboard', icon: BarChart3 },
  { key: 'calendar', label: 'Agenda / Calendario', icon: CalendarDays },
  { key: 'clients', label: 'Clientes / Pacientes', icon: Users },
  { key: 'services', label: 'Servicios y Tarifas', icon: WalletCards },
  // { key: 'billing', label: 'Mi Suscripción & Facturación', icon: CreditCard },
  { key: 'settings', label: 'Configuración del negocio', icon: Building2 },
  { key: 'account', label: 'Mi cuenta', icon: Settings2 },
  { key: 'team', label: 'Equipo', icon: Users },
] as const

function Sidebar({ onNavigate }: { onNavigate?: (view: ViewName) => void }) {
  const { activeView, theme, tenants, activeTenantId } = useAppStore()
  const isDark = theme === 'dark'
  const [whatsappStatus, setWhatsappStatus] = useState<{ connected: boolean; state: 'open' | 'close' | 'connecting' | 'not_configured'; instance_name: string | null } | null>(null)
  const activeTenantRole = String((tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? 'staff') || 'staff').toLowerCase()
  const visibleNavigation = navigation.filter((item) => {
    if (item.key === 'team') return activeTenantRole === 'owner' || activeTenantRole === 'admin'
    if (item.key === 'settings') return activeTenantRole === 'owner' || activeTenantRole === 'admin'
    return true
  })

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
    ? { label: 'Bot WhatsApp activo', tone: 'success', dot: 'bg-emerald-400' }
    : whatsappStatus?.state === 'not_configured'
      ? { label: 'Bot WhatsApp no conectado', tone: 'alert', dot: 'bg-rose-400' }
      : { label: 'Bot WhatsApp pendientes', tone: 'warning', dot: 'bg-amber-400' }

  return (
    <aside className={cn(
      'hidden w-72 shrink-0 border-r p-5 lg:flex lg:flex-col',
      isDark ? 'border-slate-700/80 bg-slate-950/60' : 'border-slate-300 bg-white/80',
    )}>
      <div className={cn(
        'mb-8 flex items-center gap-3 rounded-2xl border p-3',
        isDark ? 'border-slate-700 bg-slate-900/80' : 'border-slate-300 bg-slate-50',
      )}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-violet-500 text-base font-bold text-white">
          A
        </div>
        <div>
          <p className={cn('text-xs uppercase tracking-[0.2em]', isDark ? 'text-slate-400' : 'text-slate-500')}>Agenda</p>
          <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-slate-900')}>BOT</h2>
        </div>
      </div>

      <nav className="space-y-2">
        {visibleNavigation.map(({ key, label, icon: Icon }) => {
          const isActive = activeView === key
          return (
            <button
              key={key}
              onClick={() => onNavigate?.(key)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-all',
                isActive
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 shadow-glow dark:text-white'
                  : cn(
                      isDark ? 'border-transparent bg-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-900/70 hover:text-white' : 'border-transparent bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900',
                    ),
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </nav>

      <div className={cn('mt-auto rounded-2xl border p-4',
        whatsappBadge.tone === 'success'
          ? (isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50')
          : whatsappBadge.tone === 'warning'
            ? (isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50')
            : (isDark ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50'),
      )}>
        <div className={cn('mb-3 flex items-center gap-2',
          whatsappBadge.tone === 'success'
            ? (isDark ? 'text-emerald-200' : 'text-emerald-700')
            : whatsappBadge.tone === 'warning'
              ? (isDark ? 'text-amber-200' : 'text-amber-700')
              : (isDark ? 'text-rose-200' : 'text-rose-700'),
        )}>
          <span className={cn('inline-flex h-2.5 w-2.5 rounded-full', whatsappBadge.dot)} />
          <span className="text-sm font-medium">{whatsappBadge.label}</span>
        </div>
        <p className={cn('text-xs', isDark ? 'text-slate-300' : 'text-slate-600')}>
          {whatsappStatus?.connected
            ? 'El bot está listo para atender mensajes de WhatsApp.'
            : whatsappStatus?.state === 'not_configured'
              ? 'No hay una conexión activa de WhatsApp para este tenant.'
              : 'La conexión está en proceso o pendiente de vinculación.'}
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
