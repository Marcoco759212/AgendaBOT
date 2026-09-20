import { motion } from 'framer-motion'
import { BarChart3, CalendarDays, ChevronRight, CreditCard, Eye, EyeOff, Plus, Sparkles, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import AnalyticsCharts from './components/dashboard/AnalyticsCharts'
import KpiCard from './components/dashboard/KpiCard'
import RecentActivity from './components/dashboard/RecentActivity'
import AppointmentList from './components/calendar/AppointmentList'
import AppointmentModal from './components/calendar/AppointmentModal'
import ServiceCatalog from './components/services/ServiceCatalog'
import LandingPage from './components/landing/LandingPage'
import BillingSection from './components/billing/BillingSection'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import { Button } from './components/ui/button'
import QuickCreateModal from './components/general/QuickCreateModal'
import { API_BASE_URL, apiRequest } from './lib/api'
import { useAppStore } from './store/useAppStore'
import type { ViewName } from './types'

const mobileNavItems: { key: ViewName; label: string; icon: typeof BarChart3 }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'calendar', label: 'Agenda', icon: CalendarDays },
  { key: 'services', label: 'Servicios', icon: Sparkles },
  { key: 'billing', label: 'Billing', icon: CreditCard },
  { key: 'account', label: 'Cuenta', icon: ShieldCheck },
  { key: 'team', label: 'Equipo', icon: Sparkles },
]

const routeMap: Record<ViewName, string> = {
  landing: '/landing',
  dashboard: '/dashboard',
  calendar: '/dashboard/calendar',
  clients: '/dashboard/clients',
  services: '/dashboard/services',
  settings: '/dashboard/settings',
  billing: '/dashboard/billing',
  account: '/dashboard/account',
  team: '/dashboard/team',
}

function BusinessSettingsForm() {
  const { tenants, updateBusiness, theme, activeTenantId } = useAppStore()
  const isDark = theme === 'dark'
  const activeTenantRole = String((tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? 'staff') || 'staff').toLowerCase()
  const canManageBusiness = activeTenantRole === 'owner'
  const business = tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0]
  const [nombre, setNombre] = useState(() => business?.name ?? 'Estudio Centro')
  const [timezone, setTimezone] = useState('America/Mexico_City')
  const [promptCustomIa, setPromptCustomIa] = useState('Atiende citas, confirma disponibilidad y responde con tono profesional.')
  const [calendarStatus, setCalendarStatus] = useState<{ connected: boolean; state: 'connected' | 'not_connected' | 'needs_reconnect'; calendar_id: string | null; connected_at: string | null } | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarConnectLoading, setCalendarConnectLoading] = useState(false)
  const [calendarDisconnectLoading, setCalendarDisconnectLoading] = useState(false)
  const [calendarError, setCalendarError] = useState('')
  const oauthWindowRef = useRef<Window | null>(null)
  const calendarPollRef = useRef<number | null>(null)
  const [whatsappStatus, setWhatsappStatus] = useState<{ connected: boolean; state: 'open' | 'close' | 'connecting' | 'not_configured'; instance_name: string | null } | null>(null)
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [whatsappError, setWhatsappError] = useState('')
  const [isConnectingWhatsapp, setIsConnectingWhatsapp] = useState(false)
  const [qrPayload, setQrPayload] = useState<{ connected: boolean; awaiting_scan: boolean; instance_name: string; qrcode_base64: string; pairing_code: string } | null>(null)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [qrTimeoutMessage, setQrTimeoutMessage] = useState('')
  const [horarioAtencion, setHorarioAtencion] = useState<Record<string, { start: string; end: string; enabled: boolean; prompt_custom_ia: string }>>({
    mon: { start: '09:00', end: '18:00', enabled: true, prompt_custom_ia: 'Atiende citas, confirma disponibilidad y responde con tono profesional.' },
    tue: { start: '09:00', end: '18:00', enabled: true, prompt_custom_ia: 'Atiende citas, confirma disponibilidad y responde con tono profesional.' },
    wed: { start: '09:00', end: '18:00', enabled: true, prompt_custom_ia: 'Atiende citas, confirma disponibilidad y responde con tono profesional.' },
    thu: { start: '09:00', end: '18:00', enabled: true, prompt_custom_ia: 'Atiende citas, confirma disponibilidad y responde con tono profesional.' },
    fri: { start: '09:00', end: '18:00', enabled: true, prompt_custom_ia: 'Atiende citas, confirma disponibilidad y responde con tono profesional.' },
    sat: { start: '10:00', end: '15:00', enabled: false, prompt_custom_ia: 'Atiende citas, confirma disponibilidad y responde con tono profesional.' },
    sun: { start: '10:00', end: '13:00', enabled: false, prompt_custom_ia: 'Atiende citas, confirma disponibilidad y responde con tono profesional.' },
  })

  const stopCalendarPolling = () => {
    if (calendarPollRef.current) {
      window.clearTimeout(calendarPollRef.current)
      calendarPollRef.current = null
    }
  }

  const fetchCalendarStatus = async () => {
    if (!activeTenantId) return null

    try {
      setCalendarLoading(true)
      setCalendarError('')
      const response = await apiRequest<{ connected: boolean; state: 'connected' | 'not_connected' | 'needs_reconnect'; calendar_id: string | null; connected_at: string | null }>('/api/business/calendar/status', { method: 'GET' }, { tenant_id: activeTenantId })
      setCalendarStatus(response)
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos consultar el estado del calendario.'
      setCalendarError(message)
      setCalendarStatus({ connected: false, state: 'not_connected', calendar_id: null, connected_at: null })
      return null
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleConnectCalendar = () => {
    if (!activeTenantId || activeTenantRole !== 'owner') return

    const authUrl = `${API_BASE_URL}/oauth/google/authorize?tenant_id=${activeTenantId}`
    const popup = window.open(authUrl, '_blank', 'noopener,noreferrer')

    if (!popup) {
      setCalendarError('El navegador bloqueó la ventana de autorización. Permite las ventanas emergentes e inténtalo otra vez.')
      return
    }

    oauthWindowRef.current = popup
    setCalendarConnectLoading(true)
    setCalendarError('')
    stopCalendarPolling()

    const startedAt = Date.now()

    const pollCalendar = async () => {
      const status = await fetchCalendarStatus()

      if (status?.state === 'connected') {
        stopCalendarPolling()
        setCalendarConnectLoading(false)
        if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
          oauthWindowRef.current.close()
        }
        return
      }

      if (Date.now() - startedAt >= 180000) {
        stopCalendarPolling()
        setCalendarConnectLoading(false)
        return
      }

      calendarPollRef.current = window.setTimeout(() => {
        void pollCalendar()
      }, 4000)
    }

    calendarPollRef.current = window.setTimeout(() => {
      void pollCalendar()
    }, 4000)
  }

  const handleDisconnectCalendar = async () => {
    if (!activeTenantId || activeTenantRole !== 'owner') return

    const confirmed = window.confirm('¿Deseas desvincular Google Calendar de este tenant?')
    if (!confirmed) return

    try {
      setCalendarDisconnectLoading(true)
      setCalendarError('')
      await apiRequest<{ disconnected: true }>('/api/business/calendar/disconnect', {
        method: 'POST',
        body: JSON.stringify({ tenant_id: activeTenantId }),
      }, { tenant_id: activeTenantId })
      await fetchCalendarStatus()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos desvincular Google Calendar.'
      setCalendarError(message)
    } finally {
      setCalendarDisconnectLoading(false)
    }
  }

  const fetchWhatsappStatus = async () => {
    if (!activeTenantId) return null

    try {
      setWhatsappLoading(true)
      setWhatsappError('')
      const response = await apiRequest<{ connected: boolean; state: 'open' | 'close' | 'connecting' | 'not_configured'; instance_name: string | null }>('/api/business/whatsapp/status', { method: 'GET' }, { tenant_id: activeTenantId })
      setWhatsappStatus(response)
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos consultar el estado de WhatsApp.'
      setWhatsappError(message)
      setWhatsappStatus({ connected: false, state: 'not_configured', instance_name: null })
      return null
    } finally {
      setWhatsappLoading(false)
    }
  }

  useEffect(() => {
    void fetchCalendarStatus()
  }, [activeTenantId])

  useEffect(() => {
    void fetchWhatsappStatus()
  }, [activeTenantId])

  useEffect(() => {
    if (!isQrOpen || !activeTenantId) return

    const startedAt = Date.now()
    let timer: number | undefined

    const pollStatus = async () => {
      try {
        const response = await apiRequest<{ connected: boolean; state: 'open' | 'close' | 'connecting' | 'not_configured'; instance_name: string | null }>('/api/business/whatsapp/status', { method: 'GET' }, { tenant_id: activeTenantId })
        setWhatsappStatus(response)

        if (response.connected) {
          setIsQrOpen(false)
          setQrPayload(null)
          setQrTimeoutMessage('')
          return
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No pudimos confirmar la conexión de WhatsApp.'
        setWhatsappError(message)
      }

      if (Date.now() - startedAt >= 120000) {
        setQrTimeoutMessage('La conexión tardó demasiado. Puedes volver a intentarlo y generar un QR nuevo.')
        setIsQrOpen(true)
        return
      }

      timer = window.setTimeout(() => {
        void pollStatus()
      }, 3500)
    }

    void pollStatus()

    return () => {
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [isQrOpen, activeTenantId])

  const handleConnectWhatsapp = async () => {
    if (!activeTenantId || activeTenantRole !== 'owner') return

    try {
      setIsConnectingWhatsapp(true)
      setWhatsappError('')
      setQrTimeoutMessage('')
      const response = await apiRequest<{ connected: boolean; awaiting_scan: boolean; instance_name: string; qrcode_base64: string; pairing_code: string }>('/api/business/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({ tenant_id: activeTenantId }),
      }, { tenant_id: activeTenantId })

      setQrPayload(response)
      setIsQrOpen(true)
      setWhatsappStatus({ connected: false, state: 'connecting', instance_name: response.instance_name ?? null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos iniciar la conexión de WhatsApp.'
      setWhatsappError(message)
    } finally {
      setIsConnectingWhatsapp(false)
    }
  }

  const handleSave = async () => {
    if (!canManageBusiness) return

    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
    const normalizedSchedule: Record<string, { start: string; end: string; enabled: boolean; prompt_custom_ia: string }> = Object.fromEntries(
      dayKeys.map((day) => {
        const current = horarioAtencion[day] ?? {
          start: '09:00',
          end: '18:00',
          enabled: true,
          prompt_custom_ia: promptCustomIa,
        }

        return [day, {
          start: current.start || '09:00',
          end: current.end || '18:00',
          enabled: current.enabled ?? true,
          prompt_custom_ia: current.prompt_custom_ia || promptCustomIa,
        }]
      }),
    )

    await updateBusiness({
      id: business?.id ?? activeTenantId,
      nombre,
      timezone,
      horario_atencion: normalizedSchedule,
      prompt_custom_ia: promptCustomIa,
    })
  }

  const updateDay = (day: keyof typeof horarioAtencion, patch: Partial<typeof horarioAtencion[keyof typeof horarioAtencion]>) => {
    setHorarioAtencion((current) => ({
      ...current,
      [day]: {
        start: current[day]?.start ?? '09:00',
        end: current[day]?.end ?? '18:00',
        enabled: current[day]?.enabled ?? true,
        prompt_custom_ia: current[day]?.prompt_custom_ia ?? promptCustomIa,
        ...patch,
      },
    }))
  }

  const whatsappBadge = whatsappStatus?.connected
    ? { label: 'Conectado', tone: 'success' }
    : whatsappStatus?.state === 'not_configured'
      ? { label: 'No conectado', tone: 'default' }
      : { label: 'Esperando vinculacion', tone: 'warning' }

  const calendarStatusBadge = calendarStatus?.state === 'connected'
    ? { label: 'Conectado', tone: 'success' }
    : calendarStatus?.state === 'needs_reconnect'
      ? { label: 'Conexión interrumpida', tone: 'warning' }
      : { label: 'No conectado', tone: 'default' }

  const calendarConnectedAtLabel = calendarStatus?.connected_at
    ? new Date(calendarStatus.connected_at).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null

  const canConnectWhatsapp = activeTenantRole === 'owner' && !whatsappStatus?.connected
  const qrImageSrc = qrPayload?.qrcode_base64?.startsWith('data:image')
    ? qrPayload.qrcode_base64
    : qrPayload?.qrcode_base64 ? `data:image/png;base64,${qrPayload.qrcode_base64}` : ''

  if (!canManageBusiness) {
    return (
      <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300' : 'rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm'}>
        Solo el propietario del tenant puede editar la configuración del negocio.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-950/60 p-4' : 'rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-violet-50 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]'}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-emerald-600'}>WhatsApp</p>
            <h3 className={isDark ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-900'}>Integración del negocio</h3>
          </div>
          {canConnectWhatsapp && (
            <Button
              onClick={() => void handleConnectWhatsapp()}
              disabled={isConnectingWhatsapp || whatsappLoading}
              className={isDark ? 'px-4 py-2 text-sm' : 'px-4 py-2.5 text-sm font-bold !text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_16px_36px_rgba(16,185,129,0.32)]'}
              variant="primary"
              style={isDark ? undefined : { color: '#ffffff', backgroundColor: '#0f766e', boxShadow: '0 12px 30px rgba(15, 118, 110, 0.26)' }}
            >
              {isConnectingWhatsapp ? 'Conectando…' : 'Conectar WhatsApp'}
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={
            whatsappBadge.tone === 'success'
              ? isDark
                ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200'
                : 'rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-800'
              : whatsappBadge.tone === 'warning'
                ? isDark
                  ? 'rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-200'
                  : 'rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-800'
                : isDark
                  ? 'rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-200'
                  : 'rounded-full border border-rose-300 bg-rose-100 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-700'
          }>
            {whatsappLoading ? 'Cargando…' : whatsappBadge.label}
          </span>
          {whatsappStatus?.instance_name && (
            <span className={isDark ? 'text-sm text-slate-300' : 'text-sm text-slate-600'}>{whatsappStatus.instance_name}</span>
          )}
        </div>

        {whatsappError && (
          <div className={isDark ? 'mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200' : 'mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'}>
            {whatsappError}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className={isDark ? 'space-y-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4' : 'space-y-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm'}>
          <div>
            <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Nombre del negocio</label>
            <input value={nombre} onChange={(event) => setNombre(event.target.value)} className={isDark ? 'mt-2 w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-white' : 'mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900'} />
          </div>
          <div>
            <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Zona horaria</label>
            <input value={timezone} onChange={(event) => setTimezone(event.target.value)} className={isDark ? 'mt-2 w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-white' : 'mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900'} />
          </div>

          <div>
            <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Horario de atención</label>
            <div className="mt-3 space-y-2">
              {Object.entries(horarioAtencion).map(([day, value]) => (
                <div key={day} className={isDark ? 'rounded-xl border border-slate-700 bg-slate-900/70 p-2.5' : 'rounded-xl border border-slate-300 bg-slate-50 p-2.5'}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className={isDark ? 'text-xs font-medium uppercase tracking-[0.18em] text-slate-300' : 'text-xs font-medium uppercase tracking-[0.18em] text-slate-700'}>{day}</span>
                    <label className={isDark ? 'inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-300' : 'inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-600'}>
                      <input
                        type="checkbox"
                        checked={value.enabled}
                        onChange={(event) => updateDay(day as keyof typeof horarioAtencion, { enabled: event.target.checked })}
                        className={isDark ? 'h-3.5 w-3.5 rounded border-slate-500 bg-slate-950' : 'h-3.5 w-3.5 rounded border-slate-400 bg-white'}
                      />
                      Activo
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={value.start}
                      onChange={(event) => updateDay(day as keyof typeof horarioAtencion, { start: event.target.value })}
                      className={isDark ? 'w-full rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-2 text-xs text-white' : 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900'}
                      placeholder="09:00"
                    />
                    <input
                      value={value.end}
                      onChange={(event) => updateDay(day as keyof typeof horarioAtencion, { end: event.target.value })}
                      className={isDark ? 'w-full rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-2 text-xs text-white' : 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900'}
                      placeholder="18:00"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className={isDark ? 'space-y-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4' : 'space-y-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm'}>
            <div className={isDark ? 'rounded-xl border border-slate-700 bg-slate-900/60 p-3' : 'rounded-xl border border-slate-200 bg-slate-50 p-3'}>
              <div className="flex items-center justify-between gap-3">
                <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Google Calendar</label>
                {calendarStatus && (
                  <span className={calendarStatusBadge.tone === 'success'
                    ? (isDark ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200' : 'rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-800')
                    : calendarStatusBadge.tone === 'warning'
                      ? (isDark ? 'rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-200' : 'rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-800')
                      : (isDark ? 'rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300' : 'rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-700')
                  }>
                    {calendarLoading ? 'Cargando…' : calendarStatusBadge.label}
                  </span>
                )}
              </div>

              {calendarStatus?.state === 'connected' && calendarConnectedAtLabel && (
                <p className={isDark ? 'mt-2 text-sm text-slate-300' : 'mt-2 text-sm text-slate-600'}>Vinculado desde {calendarConnectedAtLabel}</p>
              )}

              {calendarStatus?.state === 'needs_reconnect' && (
                <p className={isDark ? 'mt-2 text-sm text-amber-200' : 'mt-2 text-sm text-amber-700'}>El acceso a Google Calendar fue revocado o expiró, vuelve a conectarlo.</p>
              )}

              {calendarError && (
                <div className={isDark ? 'mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200' : 'mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'}>
                  {calendarError}
                </div>
              )}

              {activeTenantRole === 'owner' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {calendarStatus?.state === 'connected' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className={isDark ? 'border border-amber-300/80 bg-amber-400/20 px-3 py-2 text-xs font-medium text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.2)] hover:bg-amber-400/30' : 'border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100'}
                      onClick={() => void handleDisconnectCalendar()}
                      disabled={calendarDisconnectLoading}
                    >
                      {calendarDisconnectLoading ? 'Desvinculando…' : 'Desvincular calendario'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      className={isDark ? 'px-3 py-2 text-xs' : 'px-3 py-2 text-xs'}
                      onClick={handleConnectCalendar}
                      disabled={calendarConnectLoading || calendarLoading}
                    >
                      {calendarConnectLoading ? 'Conectando…' : calendarStatus?.state === 'needs_reconnect' ? 'Reconectar' : 'Conectar con Google Calendar'}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Google Calendar ID</label>
              <div className={isDark ? 'mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-300 break-all' : 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 break-all'}>
                {calendarStatus?.calendar_id || 'Sin calendario vinculado'}
              </div>
            </div>
          </div>

          <div className={isDark ? 'space-y-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4' : 'space-y-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm'}>
            <div>
              <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Prompt IA personalizado</label>
              <p className={isDark ? 'mt-2 text-sm leading-6 text-slate-300' : 'mt-2 text-sm leading-6 text-slate-600'}>
                Define el tono, la forma de responder y las reglas que debe seguir la IA cuando atienda clientes, confirme citas y gestione conversaciones con tu negocio.
              </p>
              <textarea value={promptCustomIa} onChange={(event) => setPromptCustomIa(event.target.value)} className={isDark ? 'mt-3 min-h-[130px] w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-white' : 'mt-3 min-h-[130px] w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900'} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void handleSave()} className="px-4 py-2 text-sm">Guardar configuración</Button>
            </div>
          </div>
        </div>
      </div>

      {isQrOpen && qrPayload && (
        <div className={isDark ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4' : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4'}>
          <div className={isDark ? 'w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl' : 'w-full max-w-md rounded-3xl border border-violet-200 bg-white p-5 shadow-[0_25px_60px_rgba(15,23,42,0.16)]'}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Vinculación</p>
                <h3 className={isDark ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-900'}>Escanea el QR</h3>
              </div>
              <button onClick={() => setIsQrOpen(false)} className={isDark ? 'rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300' : 'rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700'}>
                Cerrar
              </button>
            </div>

            <div className={isDark ? 'mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4' : 'mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
              {qrImageSrc ? (
                <img
                  src={qrImageSrc}
                  alt="QR de WhatsApp"
                  className="mx-auto block max-h-64 w-full max-w-[220px] rounded-xl bg-white p-2"
                />
              ) : (
                <div className={isDark ? 'flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-600 text-sm text-slate-400' : 'flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500'}>
                  Generando QR…
                </div>
              )}
            </div>

            <div className={isDark ? 'mt-5 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-sm text-violet-100' : 'mt-5 rounded-xl border border-violet-300 bg-violet-100 p-3 text-sm text-violet-800'}>
              o ingresa este código: <span className="font-semibold">{qrPayload.pairing_code || 'Sin código disponible'}</span>
            </div>

            {qrTimeoutMessage && (
              <div className={isDark ? 'mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200' : 'mt-4 rounded-xl border border-amber-300 bg-amber-100 p-3 text-sm text-amber-800'}>
                {qrTimeoutMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AccountSecuritySection() {
  const { changePassword, theme } = useAppStore()
  const isDark = theme === 'dark'
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)

    try {
      const message = await changePassword({ current_password: currentPassword, new_password: newPassword })
      setSuccessMessage(message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos cambiar la contraseña.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-5' : 'rounded-2xl border border-slate-300 bg-white p-5 shadow-sm'}>
      <div className="mb-5">
        <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Seguridad</p>
        <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>Contraseña</h2>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <div className="space-y-2 md:col-span-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Contraseña actual</label>
          <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5' : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5'}>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={isDark ? 'w-full bg-transparent text-sm text-white outline-none' : 'w-full bg-transparent text-sm text-slate-900 outline-none'}
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setShowCurrent((current) => !current)} className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Nueva contraseña</label>
          <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5' : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5'}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={isDark ? 'w-full bg-transparent text-sm text-white outline-none' : 'w-full bg-transparent text-sm text-slate-900 outline-none'}
              placeholder="Mínimo 8 caracteres"
              required
            />
            <button type="button" onClick={() => setShowNew((current) => !current)} className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Confirmar contraseña</label>
          <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5' : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5'}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={isDark ? 'w-full bg-transparent text-sm text-white outline-none' : 'w-full bg-transparent text-sm text-slate-900 outline-none'}
              placeholder="Repite la nueva contraseña"
              required
            />
            <button type="button" onClick={() => setShowConfirm((current) => !current)} className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className={isDark ? 'md:col-span-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'}>
            {error}
          </div>
        )}

        {successMessage && (
          <div className={isDark ? 'md:col-span-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200' : 'md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'}>
            {successMessage}
          </div>
        )}

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={isSubmitting} className={isDark ? 'rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60' : 'rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60'}>
            {isSubmitting ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </form>
    </section>
  )
}

function ForgotPasswordScreen() {
  const navigate = useNavigate()
  const { forgotPassword, theme } = useAppStore()
  const isDark = theme === 'dark'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<{ message: string; success: boolean } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)
    setIsSubmitting(true)

    try {
      const message = await forgotPassword(email.trim())
      setStatus({ message, success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos enviar tu enlace de recuperación.'
      setStatus({ message, success: false })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={isDark ? 'min-h-screen bg-[#0A0D14] px-4 py-12 text-slate-50' : 'min-h-screen bg-slate-100 px-4 py-12 text-slate-900'}>
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-700 bg-slate-950/90 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.6)]">
        <p className={isDark ? 'text-[10px] uppercase tracking-[0.24em] text-slate-400' : 'text-[10px] uppercase tracking-[0.24em] text-slate-500'}>Seguridad</p>
        <h1 className={isDark ? 'mt-2 text-3xl font-semibold text-white' : 'mt-2 text-3xl font-semibold text-slate-900'}>¿Olvidaste tu contraseña?</h1>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400'}
              placeholder="tu@correo.com"
              required
            />
          </div>

          {status && (
            <div className={status.success ? (isDark ? 'rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200' : 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700') : (isDark ? 'rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700')}>
              {status.message}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className={isDark ? 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60' : 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60'}>
            {isSubmitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <button type="button" onClick={() => navigate('/login')} className={isDark ? 'mt-5 text-sm text-emerald-400' : 'mt-5 text-sm text-emerald-600'}>
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}

function ResetPasswordScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword, theme } = useAppStore()
  const isDark = theme === 'dark'
  const token = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Falta el token de recuperación. Solicita un nuevo enlace.')
      return
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)

    try {
      const message = await resetPassword({ token, new_password: newPassword })
      setSuccess(message)
      window.setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos restablecer tu contraseña.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={isDark ? 'min-h-screen bg-[#0A0D14] px-4 py-12 text-slate-50' : 'min-h-screen bg-slate-100 px-4 py-12 text-slate-900'}>
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-700 bg-slate-950/90 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.6)]">
        <p className={isDark ? 'text-[10px] uppercase tracking-[0.24em] text-slate-400' : 'text-[10px] uppercase tracking-[0.24em] text-slate-500'}>Acceso</p>
        <h1 className={isDark ? 'mt-2 text-3xl font-semibold text-white' : 'mt-2 text-3xl font-semibold text-slate-900'}>Restablecer contraseña</h1>

        {!token ? (
          <div className={isDark ? 'mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200' : 'mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700'}>
            <p>El enlace de recuperación no es válido o ya expiró.</p>
            <button type="button" onClick={() => navigate('/forgot-password')} className={isDark ? 'mt-3 text-emerald-400' : 'mt-3 text-emerald-600'}>
              Solicitar otro enlace
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Nueva contraseña</label>
              <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5' : 'flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5'}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={isDark ? 'w-full bg-transparent text-sm text-white outline-none' : 'w-full bg-transparent text-sm text-slate-900 outline-none'}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Confirmar contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400'}
                placeholder="Repite la contraseña"
                required
              />
            </div>

            {error && (
              <div className={isDark ? 'rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'}>
                {error}
              </div>
            )}

            {success && (
              <div className={isDark ? 'rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200' : 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'}>
                {success}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className={isDark ? 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60' : 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60'}>
              {isSubmitting ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </form>
        )}

        <button type="button" onClick={() => navigate('/login')} className={isDark ? 'mt-5 text-sm text-emerald-400' : 'mt-5 text-sm text-emerald-600'}>
          Ir a iniciar sesión
        </button>
      </div>
    </div>
  )
}

function AuthScreen({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const navigate = useNavigate()
  const { login, register, theme, setTheme, isAuthenticated, isSessionReady, restoreSession } = useAppStore()
  const isDark = theme === 'dark'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  useEffect(() => {
    if (isSessionReady && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isSessionReady, navigate])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await register({
          email: email.trim(),
          password,
          nombre_negocio: nombreNegocio.trim(),
          nombre_usuario: nombreUsuario.trim(),
        })
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos completar la solicitud.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isSessionReady) {
    return (
      <div className={isDark ? 'flex min-h-screen items-center justify-center bg-[#0A0D14] text-white' : 'flex min-h-screen items-center justify-center bg-slate-100 text-slate-900'}>
        <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Cargando sesión…</div>
      </div>
    )
  }

  return (
    <div className={isDark ? 'min-h-screen bg-[#0A0D14] text-slate-50' : 'min-h-screen bg-slate-100 text-slate-900'}>
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12">
        <div className={isDark ? 'grid w-full overflow-hidden rounded-[2rem] border border-slate-700/80 bg-slate-950/90 shadow-[0_30px_100px_rgba(15,23,42,0.6)] lg:grid-cols-[1.1fr_0.9fr]' : 'grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_0.9fr]'}>
          <div className={isDark ? 'relative hidden overflow-hidden border-r border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,#0B1120_0%,#111827_50%,#0F172A_100%)] p-10 lg:block' : 'relative hidden overflow-hidden border-r border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_30%,#f8fafc_100%)] p-10 lg:block'}>
            <div className="relative z-10 max-w-md">
              <div className={isDark ? 'mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-emerald-200' : 'mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-emerald-700'}>
                AgendaBOT
              </div>
              <h1 className={isDark ? 'text-4xl font-semibold text-white' : 'text-4xl font-semibold text-slate-900'}>Automatiza tu negocio con IA.</h1>
              <p className={isDark ? 'mt-5 text-base leading-7 text-slate-300' : 'mt-5 text-base leading-7 text-slate-600'}>
                Gestiona citas, confirma disponibilidad y responde clientes desde una sola plataforma.
              </p>
              <div className="mt-8 grid gap-4 text-sm">
                {['Agenda inteligente', 'Recordatorios automáticos', 'WhatsApp + Google Calendar'].map((feature) => (
                  <div key={feature} className={isDark ? 'flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200' : 'flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-slate-700'}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">✓</div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-md">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className={isDark ? 'text-[10px] uppercase tracking-[0.24em] text-slate-400' : 'text-[10px] uppercase tracking-[0.24em] text-slate-500'}>Acceso</p>
                  <h2 className={isDark ? 'mt-2 text-3xl font-semibold text-white' : 'mt-2 text-3xl font-semibold text-slate-900'}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={isDark ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200' : 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700'}
                  aria-label="Toggle theme"
                  type="button"
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
              </div>

              <div className={isDark ? 'mb-6 flex rounded-full border border-slate-700 bg-slate-900/80 p-1' : 'mb-6 flex rounded-full border border-slate-300 bg-white p-1 shadow-sm'}>
                {(['login', 'register'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setError('')
                      navigate(option === 'login' ? '/login' : '/register', { replace: true })
                    }}
                    className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${mode === option ? (isDark ? 'bg-slate-100 text-slate-950' : 'bg-slate-900 text-white') : isDark ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    {option === 'login' ? 'Login' : 'Registro'}
                  </button>
                ))}
              </div>

              <form className="space-y-4" onSubmit={submit}>
                {mode === 'register' && (
                  <>
                    <div>
                      <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Nombre del negocio</label>
                      <input value={nombreNegocio} onChange={(event) => setNombreNegocio(event.target.value)} className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400'} placeholder="Mi negocio" required />
                    </div>
                    <div>
                      <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Tu nombre</label>
                      <input value={nombreUsuario} onChange={(event) => setNombreUsuario(event.target.value)} className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400'} placeholder="Ana García" required />
                    </div>
                  </>
                )}

                <div>
                  <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Correo</label>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400'} placeholder="dueno@negocio.com" required />
                </div>

                <div>
                  <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 pr-11 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400'}
                      placeholder="••••••••"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((current) => !current)}
                      className={isDark ? 'absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-slate-300 transition hover:text-white' : 'absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-slate-500 transition hover:text-slate-800'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className={isDark ? 'rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className={isDark ? 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60' : 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60'}>
                  {isSubmitting ? 'Procesando…' : mode === 'login' ? 'Entrar al panel' : 'Crear negocio'}
                </button>
              </form>

              <div className="mt-5 space-y-3 text-center text-sm">
                {mode === 'login' && (
                  <button type="button" className={isDark ? 'text-emerald-400 underline-offset-4 hover:underline' : 'text-emerald-600 underline-offset-4 hover:underline'} onClick={() => navigate('/forgot-password', { replace: true })}>
                    ¿Olvidaste tu contraseña?
                  </button>
                )}

                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                  <button type="button" className={isDark ? 'font-medium text-emerald-400 underline-offset-4 hover:underline' : 'font-medium text-emerald-600 underline-offset-4 hover:underline'} onClick={() => navigate(mode === 'login' ? '/register' : '/login', { replace: true })}>
                    {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamMembersList() {
  const { listTeamMembers, theme, activeTenantId, user, tenants, updateTeamMemberRole, removeTeamMember } = useAppStore()
  const isDark = theme === 'dark'
  const [members, setMembers] = useState<Array<{ id: string; email: string; nombre: string; role: 'owner' | 'admin' | 'staff' }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState<{ id: string; name: string } | null>(null)

  const activeTenantRole = String((tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? 'staff') || 'staff').toLowerCase()
  const isOwner = activeTenantRole === 'owner'

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true)
        const data = await listTeamMembers(activeTenantId)
        setMembers(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No pudimos cargar el equipo.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void loadMembers()
  }, [activeTenantId, listTeamMembers])

  const handleRoleChange = async (userId: string, role: 'admin' | 'staff') => {
    try {
      setError('')
      const response = await updateTeamMemberRole({ tenant_id: activeTenantId, user_id: userId, role })
      setMembers((current) => current.map((member) => member.id === userId ? { ...member, role: response.role } : member))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos actualizar el rol.'
      setError(message)
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      setError('')
      await removeTeamMember({ tenant_id: activeTenantId, user_id: userId })
      setMembers((current) => current.filter((member) => member.id !== userId))
      setPendingAction(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos eliminar al miembro.'
      setError(message)
    }
  }

  const currentUserId = user.id ?? ''

  return (
    <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-5' : 'rounded-2xl border border-slate-300 bg-white p-5 shadow-sm'}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Equipo</p>
          <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>Miembros del negocio</h2>
        </div>
      </div>

      {error && (
        <div className={isDark ? 'mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-600'}>Loading equipo…</div>
      ) : members.length === 0 ? (
        <div className={isDark ? 'rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300' : 'rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600'}>
          No hay miembros en este tenant.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/80">
          <div className={isDark ? 'grid grid-cols-[1.4fr_1.2fr_1fr_0.9fr] gap-3 bg-slate-950/90 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-slate-400' : 'grid grid-cols-[1.4fr_1.2fr_1fr_0.9fr] gap-3 bg-slate-100 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-slate-500'}>
            <span>Nombre</span>
            <span>Correo</span>
            <span>Rol</span>
            <span>Acciones</span>
          </div>

          {members.map((member) => {
            const isOwnerMember = member.role === 'owner'
            const isCurrentUser = member.id === currentUserId
            const canEditRole = isOwner && !isOwnerMember && !isCurrentUser

            return (
              <div key={member.id} className={isDark ? 'grid grid-cols-[1.4fr_1.2fr_1fr_0.9fr] items-center gap-3 border-t border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-200' : 'grid grid-cols-[1.4fr_1.2fr_1fr_0.9fr] items-center gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-700'}>
                <span className="font-medium">{member.nombre}</span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{member.email}</span>
                <div>
                  {canEditRole ? (
                    <select
                      value={member.role}
                      onChange={(event) => void handleRoleChange(member.id, event.target.value as 'admin' | 'staff')}
                      className={isDark ? 'w-full rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-white outline-none' : 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 outline-none'}
                    >
                      <option value="admin">Administrador</option>
                      <option value="staff">Personal</option>
                    </select>
                  ) : (
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{member.role === 'owner' ? 'Propietario' : member.role === 'admin' ? 'Administrador' : 'Personal'}</span>
                  )}
                </div>
                <div>
                  {isOwner && !isOwnerMember && !isCurrentUser ? (
                    <button
                      type="button"
                      onClick={() => setPendingAction({ id: member.id, name: member.nombre })}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[10px] uppercase tracking-[0.18em] text-rose-200"
                    >
                      Eliminar
                    </button>
                  ) : (
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pendingAction && (
        <div className={isDark ? 'mt-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-4' : 'mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
          <p className={isDark ? 'text-sm text-slate-200' : 'text-sm text-slate-700'}>
            ¿Seguro que quieres quitar a <span className="font-semibold">{pendingAction.name}</span> del equipo?
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setPendingAction(null)} className={isDark ? 'rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200' : 'rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700'}>
              Cancelar
            </button>
            <button type="button" onClick={() => void handleRemove(pendingAction.id)} className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white">
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TeamInviteForm() {
  const { inviteTeamMember, theme } = useAppStore()
  const isDark = theme === 'dark'
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'staff'>('admin')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ nombre: string; email: string; role: 'admin' | 'staff'; password: string } | null>(null)

  const generatePassword = () => {
    const random = Math.random().toString(36).slice(2, 10)
    const suffix = Math.random().toString(36).slice(2, 6)
    const next = `${random}${suffix}!`
    setPassword(next)
    setShowPassword(true)
  }

  const handleSubmit = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError('Completa nombre, correo y contraseña temporal.')
      setSuccess(null)
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const result = await inviteTeamMember({ nombre: nombre.trim(), email: email.trim(), password, role })
      setSuccess({
        nombre: result.user.nombre,
        email: result.user.email,
        role: result.role,
        password: result.password,
      })
      setNombre('')
      setEmail('')
      setPassword('')
      setRole('admin')
      setShowPassword(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos crear la cuenta del equipo.'
      setSuccess(null)
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyPassword = async () => {
    if (!success?.password) return
    try {
      await navigator.clipboard.writeText(success.password)
    } catch {
      // Intentionally ignored: user can still copy manually.
    }
  }

  return (
    <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-5' : 'rounded-2xl border border-slate-300 bg-white p-5 shadow-sm'}>
      <div className="mb-5">
        <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Equipo</p>
        <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>Invitar miembro</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Nombre</label>
          <input
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej. Ana García"
            className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500'}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ana@negocio.com"
            className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500'}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Contraseña temporal</label>
          <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5' : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5'}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={isDark ? 'w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500' : 'w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500'}
            />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className={isDark ? 'text-slate-300' : 'text-slate-600'} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={generatePassword} className={isDark ? 'text-xs font-medium text-violet-300' : 'text-xs font-medium text-violet-700'}>
              Generar contraseña
            </button>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Rol</label>
          <div className={isDark ? 'grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-2 md:grid-cols-2' : 'grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 md:grid-cols-2'}>
            {[
              { value: 'admin', label: 'Administrador', description: 'Control total del tenant' },
              { value: 'staff', label: 'Personal / Staff', description: 'Acceso limitado a tareas' },
            ].map((option) => {
              const selected = role === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value as 'admin' | 'staff')}
                  className={[
                    'rounded-xl border p-3 text-left transition-all duration-200',
                    selected
                      ? isDark
                        ? 'border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(52,211,153,0.2)]'
                        : 'border-emerald-300 bg-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]'
                      : isDark
                        ? 'border-slate-700 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>{option.label}</span>
                    <span className={[
                      'flex h-5 w-5 items-center justify-center rounded-full border',
                      selected
                        ? isDark
                          ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                          : 'border-emerald-500 bg-emerald-500 text-white'
                        : isDark
                          ? 'border-slate-600 bg-slate-900 text-slate-500'
                          : 'border-slate-300 bg-white text-slate-400',
                    ].join(' ')}>
                      {selected ? '✓' : ''}
                    </span>
                  </div>
                  <p className={isDark ? 'mt-2 text-xs leading-5 text-slate-400' : 'mt-2 text-xs leading-5 text-slate-500'}>{option.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className={isDark ? 'mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'}>
          {error}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className={isDark ? 'rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60' : 'rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60'}
        >
          {isSubmitting ? 'Creando…' : 'Crear cuenta'}
        </button>
      </div>

      {success && (
        <div className={isDark ? 'mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4' : 'mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4'}>
          <p className={isDark ? 'text-sm font-medium text-emerald-200' : 'text-sm font-medium text-emerald-800'}>Cuenta creada correctamente.</p>
          <div className={isDark ? 'mt-3 space-y-2 text-sm text-slate-200' : 'mt-3 space-y-2 text-sm text-slate-700'}>
            <p><span className="font-medium">Nombre:</span> {success.nombre}</p>
            <p><span className="font-medium">Correo:</span> {success.email}</p>
            <p><span className="font-medium">Rol:</span> {success.role === 'admin' ? 'Administrador' : 'Personal / Staff'}</p>
            <div className={isDark ? 'rounded-xl border border-slate-700 bg-slate-950/80 p-3' : 'rounded-xl border border-slate-200 bg-white p-3'}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">Contraseña temporal</span>
                <button onClick={() => void copyPassword()} className={isDark ? 'rounded-lg border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-200' : 'rounded-lg border border-slate-300 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-700'}>
                  Copiar
                </button>
              </div>
              <p className={isDark ? 'mt-2 break-all font-mono text-xs text-emerald-200' : 'mt-2 break-all font-mono text-xs text-emerald-700'}>{success.password}</p>
            </div>
            <p className={isDark ? 'text-xs text-slate-300' : 'text-xs text-slate-600'}>
              Esta persona debe cambiar la contraseña la primera vez que inicie sesión.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function AppShell() {
  const { activeView, activeTenantId, tenants, setActiveView, setStatusFilter, statusFilter, theme, quickCreateType, setQuickCreateType, hydrateFromApi, availability, analyticsKpis, dailyBookings, hourlyDemand, serviceMix, recentActivity, loadAnalytics, loadRecentActivity, customers, customerDetail, loadCustomerDetail } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const isDark = theme === 'dark'
  const activeTenantRole = String((tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? 'staff') || 'staff').toLowerCase()
  const canViewAnalytics = activeTenantRole === 'owner' || activeTenantRole === 'admin'

  useEffect(() => {
    void hydrateFromApi()
  }, [hydrateFromApi])

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      if (canViewAnalytics) {
        void loadAnalytics('30d')
      }
      void loadRecentActivity(10)
    }
  }, [location.pathname, loadAnalytics, loadRecentActivity, canViewAnalytics])

  useEffect(() => {
    const current = Object.entries(routeMap).find(([, path]) => path === location.pathname)
    if (current) {
      setActiveView(current[0] as ViewName)
    }
  }, [location.pathname, setActiveView])

  const statusOptions = useMemo(
    () => [
      { key: 'all', label: 'Todas' },
      { key: 'confirmed', label: 'Confirmadas' },
      { key: 'pending', label: 'Pendientes' },
      { key: 'cancelled', label: 'Canceladas' },
    ],
    [],
  )

  const handleNavigate = (nextView: ViewName) => {
    setActiveView(nextView)
    navigate(routeMap[nextView])
  }

  return (
    <div className={isDark ? 'dark' : 'light'}>
      <div className={isDark ? 'min-h-screen bg-[#0A0D14] text-slate-50 antialiased' : 'min-h-screen bg-slate-100 text-slate-900 antialiased'}>
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className={isDark ? 'absolute inset-0 bg-grid bg-[size:24px_24px] opacity-20' : 'absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.15),_transparent_60%)] opacity-90'} />
          <div className={isDark ? 'absolute left-[-8%] top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl' : 'absolute left-[-8%] top-0 h-72 w-72 rounded-full bg-emerald-200 blur-3xl'} />
          <div className={isDark ? 'absolute right-[-10%] top-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl' : 'absolute right-[-10%] top-20 h-80 w-80 rounded-full bg-violet-200 blur-3xl'} />
          <div className={isDark ? 'absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-sky-500/5 blur-3xl' : 'absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-sky-200 blur-3xl'} />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
          <Sidebar onNavigate={handleNavigate} />

          <div className="flex min-w-0 flex-1 flex-col">
            <Header />

            <main className="flex-1 px-4 py-5 pb-24 lg:px-6 lg:py-6 lg:pb-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={isDark ? 'text-xs uppercase tracking-[0.22em] text-slate-400' : 'text-xs uppercase tracking-[0.22em] text-slate-500'}>Panel de operaciones</p>
                  <h1 className={isDark ? 'mt-2 text-2xl font-semibold text-white md:text-3xl' : 'mt-2 text-2xl font-semibold text-slate-900 md:text-3xl'}>Centro de control AI + agendamiento</h1>
                </div>

                <motion.div whileHover={{ scale: 1.01 }} className="relative rounded-2xl p-[1px] bg-gradient-to-r from-emerald-500 via-violet-500 to-violet-700">
                  <Button
                    className={isDark ? 'h-12 rounded-2xl border-0 bg-slate-950/90 px-5 text-sm font-medium text-white shadow-[0_0_25px_rgba(16,185,129,0.2)]' : 'h-12 rounded-2xl border-0 bg-white px-5 text-sm font-medium text-slate-900 shadow-[0_0_25px_rgba(16,185,129,0.12)]'}
                    onClick={() => setQuickCreateType('appointment')}
                  >
                    <Plus className="mr-2 h-4 w-4 text-emerald-300" />
                    Nueva cita
                  </Button>
                </motion.div>
              </div>

              {location.pathname === '/dashboard' && (
                <>
                  {!canViewAnalytics && (
                    <div className={isDark ? 'mb-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300' : 'mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm'}>
                      La analítica financiera no está disponible para tu rol.
                    </div>
                  )}

                  {canViewAnalytics && (
                    <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {analyticsKpis.map((item) => (
                        <KpiCard key={item.id} item={item} />
                      ))}
                    </section>
                  )}

                  {canViewAnalytics && (
                    <section className="mb-5 grid gap-4 xl:grid-cols-[1.75fr_1fr]">
                      <AnalyticsCharts data={dailyBookings} hourlyDemand={hourlyDemand} serviceMix={serviceMix} />
                      <RecentActivity items={recentActivity} />
                    </section>
                  )}

                  {!canViewAnalytics && (
                    <section className="mb-5 grid gap-4 xl:grid-cols-[1fr]">
                      <RecentActivity items={recentActivity} />
                    </section>
                  )}
                </>
              )}

              {location.pathname === '/dashboard/calendar' && (
                <section className="grid gap-4 xl:grid-cols-[1.08fr_1.6fr]">
                  <div className={isDark ? 'rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-[0_10px_40px_rgba(15,23,42,0.35)]' : 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm'}>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className={isDark ? 'text-[10px] uppercase tracking-[0.24em] text-slate-400' : 'text-[10px] uppercase tracking-[0.24em] text-slate-500'}>Agenda</p>
                        <h2 className={isDark ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-900'}>Citas del día</h2>
                      </div>
                      <button className={isDark ? 'rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200' : 'rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-800 shadow-sm'}>
                        Día
                      </button>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setStatusFilter(option.key as 'all' | 'confirmed' | 'pending' | 'cancelled')}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            statusFilter === option.key
                              ? isDark
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.15)]'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 shadow-[0_0_18px_rgba(16,185,129,0.1)]'
                              : isDark
                                ? 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-600 hover:text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <AppointmentList />
                  </div>

                  <div className={isDark ? 'rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-[0_10px_40px_rgba(15,23,42,0.35)]' : 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm'}>
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <p className={isDark ? 'text-[10px] uppercase tracking-[0.24em] text-slate-400' : 'text-[10px] uppercase tracking-[0.24em] text-slate-500'}>Vista semanal</p>
                        <h3 className={isDark ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-900'}>Calendario inteligente</h3>
                      </div>
                      <div className={isDark ? 'flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-violet-200' : 'flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-violet-700'}>
                        <Sparkles className="h-3 w-3" />
                        IA asistiendo
                      </div>
                    </div>

                    <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-950/60 p-3' : 'rounded-2xl border border-slate-300 bg-slate-50 p-3'}>
                      <div className={isDark ? 'mb-3 grid grid-cols-7 gap-2 text-center text-[11px] font-medium text-slate-400' : 'mb-3 grid grid-cols-7 gap-2 text-center text-[11px] font-medium text-slate-500'}>
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                          <div key={day} className="py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35].map((day) => {
                          const isBooked = availability.length > 0 ? availability.some((slot) => String(slot.day).includes(String(day)) || String(slot.start).startsWith(String(day))) : [3, 8, 10, 15, 20, 27, 31].includes(day)
                          return (
                            <button
                              key={day}
                              className={`flex h-12 items-center justify-center rounded-xl border text-xs transition-all ${
                                isBooked
                                  ? isDark
                                    ? 'border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-200 shadow-[0_0_22px_rgba(16,185,129,0.12)]'
                                    : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 shadow-[0_0_18px_rgba(16,185,129,0.08)]'
                                  : isDark
                                    ? 'border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800'
                              }`}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className={isDark ? 'mt-5 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4' : 'mt-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm'}>
                      <div className="flex items-center justify-between">
                        <p className={isDark ? 'text-sm font-medium text-white' : 'text-sm font-medium text-slate-900'}>Reservas destacadas</p>
                        <ChevronRight className={isDark ? 'h-4 w-4 text-slate-400' : 'h-4 w-4 text-slate-500'} />
                      </div>
                      <div className="mt-3 space-y-2">
                        {(availability.length > 0 ? availability.slice(0, 3).map((slot) => `${slot.day} • ${slot.start}-${slot.end}`) : ['Corte premium • 11:00', 'Consulta dermatológica • 15:45', 'Botox facial • 17:30']).map((item, index) => (
                          <div key={item} className={`rounded-xl border px-3 py-2.5 text-sm ${
                            index === 0
                              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'
                              : index === 1
                                ? 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-100'
                                : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-100'
                          }`}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {location.pathname === '/dashboard/services' && (
                <div>
                  <div className="mb-5 flex justify-end">
                    <Button onClick={() => setQuickCreateType('service')} className="rounded-xl px-4 py-2 text-sm">
                      Agregar Servicio
                    </Button>
                  </div>
                  <ServiceCatalog />
                </div>
              )}

              {location.pathname === '/dashboard/clients' && (
                <section className={isDark ? 'grid gap-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 lg:grid-cols-[0.9fr_1.5fr]' : 'grid gap-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm lg:grid-cols-[0.9fr_1.5fr]'}>
                  <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-950/70 p-4' : 'rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
                    <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Clientes</p>
                    <div className="mt-4 space-y-2">
                      {customers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => void loadCustomerDetail(customer.id)}
                          className={isDark ? 'flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-left text-sm text-slate-200' : 'flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-700'}
                        >
                          <span>{customer.name}</span>
                          <span className={isDark ? 'text-[10px] uppercase tracking-[0.18em] text-slate-400' : 'text-[10px] uppercase tracking-[0.18em] text-slate-500'}>{customer.phone}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-950/70 p-4' : 'rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
                    {customerDetail ? (
                      <>
                        <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Historial</p>
                        <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>{customerDetail.name}</h2>
                        <p className={isDark ? 'mt-2 text-sm text-slate-400' : 'mt-2 text-sm text-slate-600'}>{customerDetail.phone} · {customerDetail.email || 'email no disponible'}</p>

                        <div className="mt-5 space-y-3">
                          {customerDetail.appointments.length > 0 ? customerDetail.appointments.map((appointment) => (
                            <div key={appointment.id} className={isDark ? 'rounded-xl border border-slate-700 bg-slate-900/80 p-3' : 'rounded-xl border border-slate-200 bg-white p-3'}>
                              <div className="flex items-center justify-between gap-3">
                                <span className={isDark ? 'text-sm font-medium text-white' : 'text-sm font-medium text-slate-900'}>{appointment.service}</span>
                                <span className={appointment.status === 'cancelled' ? 'rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-rose-200' : appointment.status === 'confirmed' ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-200' : 'rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-200'}>
                                  {appointment.status}
                                </span>
                              </div>
                              <div className={isDark ? 'mt-2 flex items-center justify-between text-xs text-slate-400' : 'mt-2 flex items-center justify-between text-xs text-slate-500'}>
                                <span>{appointment.date}</span>
                                <span>${appointment.amount.toLocaleString()}</span>
                              </div>
                            </div>
                          )) : (
                            <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-600'}>Sin historial de citas.</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-600'}>Selecciona un cliente para ver su historial.</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {location.pathname === '/dashboard/billing' && <BillingSection />}

              {location.pathname === '/dashboard/account' && (
                <div className="space-y-5">
                  <section className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-6' : 'rounded-2xl border border-slate-300 bg-white p-6 shadow-sm'}>
                    <div>
                      <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Mi cuenta</p>
                      <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>Perfil y seguridad</h2>
                    </div>
                  </section>
                  <AccountSecuritySection />
                </div>
              )}

              {location.pathname === '/dashboard/settings' && (
                <section className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-6' : 'rounded-2xl border border-slate-300 bg-white p-6 shadow-sm'}>
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                      <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Configuración</p>
                      <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>Bot & WhatsApp</h2>
                    </div>
                  </div>

                  <BusinessSettingsForm />
                </section>
              )}

              {location.pathname === '/dashboard/team' && (activeTenantRole === 'owner' || activeTenantRole === 'admin') && (
                <div className="space-y-5">
                  <TeamMembersList />
                  {activeTenantRole === 'owner' && <TeamInviteForm />}
                </div>
              )}
            </main>
          </div>
        </div>

        <nav className={isDark ? 'fixed inset-x-0 bottom-0 z-30 border-t border-slate-700 bg-slate-950/90 p-2 backdrop-blur-xl lg:hidden' : 'fixed inset-x-0 bottom-0 z-30 border-t border-slate-300 bg-white/90 p-2 backdrop-blur-xl lg:hidden'}>
          <div className="grid grid-cols-4 gap-2">
            {mobileNavItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setShowMobileMenu(false)
                  handleNavigate(key)
                }}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] ${
                  activeView === key ? isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-500/10 text-emerald-700' : isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {showMobileMenu && (
          <div className={isDark ? 'fixed inset-0 z-40 bg-slate-950/70 p-4 backdrop-blur-sm lg:hidden' : 'fixed inset-0 z-40 bg-slate-900/20 p-4 backdrop-blur-sm lg:hidden'}>
            <div className={isDark ? 'mt-20 rounded-2xl border border-slate-700 bg-slate-900 p-4' : 'mt-20 rounded-2xl border border-slate-300 bg-white p-4 shadow-xl'}>
              <button onClick={() => setShowMobileMenu(false)} className={isDark ? 'mb-3 text-sm text-slate-300' : 'mb-3 text-sm text-slate-600'}>Cerrar</button>
              <div className="space-y-2">
                {mobileNavItems.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setShowMobileMenu(false)
                      handleNavigate(key)
                    }}
                    className={isDark ? 'flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-left text-sm text-slate-200' : 'flex w-full items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 p-3 text-left text-sm text-slate-700'}
                  >
                    <Icon className="h-4 w-4 text-emerald-300" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <AppointmentModal />
        {quickCreateType && (
          <QuickCreateModal
            type={quickCreateType}
            open={Boolean(quickCreateType)}
            onClose={() => setQuickCreateType(null)}
          />
        )}
      </div>
    </div>
  )
}

function App() {
  const { isAuthenticated, isSessionReady, restoreSession } = useAppStore()

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  if (!isSessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900 dark:bg-[#0A0D14] dark:text-white">
        <div className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Cargando sesión…</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthScreen mode="login" />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthScreen mode="register" />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordScreen />} />
      <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordScreen />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/dashboard" element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/account" element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/calendar" element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/clients" element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/services" element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/settings" element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/billing" element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/team" element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
