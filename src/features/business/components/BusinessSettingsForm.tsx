import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../shared/components/button'
import { API_BASE_URL } from '../../../lib/api'
import { getCalendarStatus, disconnectCalendar, getWhatsappStatus, connectWhatsapp } from '../../../api/business.api'
import { useAppStore } from '../../../store/useAppStore'

export default function BusinessSettingsForm() {
  const { tenants, updateBusiness, theme, activeTenantId } = useAppStore()
  const isDark = theme === 'dark'
  const activeTenantRole = String((tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? 'staff') || 'staff').toLowerCase()
  const canManageBusiness = activeTenantRole === 'owner' || activeTenantRole === 'admin'
  const business = tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0]
  const [nombre, setNombre] = useState(() => business?.name ?? 'Mi negocio')
  const [timezone, setTimezone] = useState(() => business?.timezone ?? 'America/Mexico_City')
  const [direccion, setDireccion] = useState(() => business?.address ?? '')
  const [referenciasDireccion, setReferenciasDireccion] = useState(() => business?.locationReference ?? '')
  const [promptCustomIa, setPromptCustomIa] = useState(() => business?.promptCustomIa || 'Atiende citas y confirma disponibilidad.')

  // Los useState de arriba solo leen "business" una vez, al montar el componente. Si cambias de
  // negocio sin que este componente se desmonte (por ejemplo, seleccionando otro tenant en el
  // Header mientras ya estas en "Configuracion del negocio"), los campos se quedaban con los
  // valores del negocio anterior — con el riesgo real de guardar esos valores viejos sobre el
  // negocio nuevo. Este efecto los vuelve a sincronizar cada vez que cambia el negocio activo
  // o llegan datos frescos del backend (hydrateFromApi) para ese negocio.
  useEffect(() => {
    setNombre(business?.name ?? 'Mi negocio')
    setTimezone(business?.timezone ?? 'America/Mexico_City')
    setDireccion(business?.address ?? '')
    setReferenciasDireccion(business?.locationReference ?? '')
    setPromptCustomIa(business?.promptCustomIa || 'Atiende citas y confirma disponibilidad.')
  }, [activeTenantId, business?.name, business?.timezone, business?.address, business?.locationReference, business?.promptCustomIa])
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
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isConnectingWhatsapp, setIsConnectingWhatsapp] = useState(false)
  const [qrPayload, setQrPayload] = useState<{ connected: boolean; awaiting_scan: boolean; instance_name: string; qrcode_base64: string; pairing_code: string } | null>(null)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [qrTimeoutMessage, setQrTimeoutMessage] = useState('')

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
      const response = await getCalendarStatus(activeTenantId)
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
      await disconnectCalendar(activeTenantId)
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
      const response = await getWhatsappStatus(activeTenantId)
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
        const response = await getWhatsappStatus(activeTenantId)
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
      const response = await connectWhatsapp(activeTenantId)

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

    setIsSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      await updateBusiness({
        id: business?.id ?? activeTenantId,
        nombre,
        timezone,
        prompt_custom_ia: promptCustomIa,
        direccion,
        referencias_direccion: referenciasDireccion,
      })
      setSaveSuccess(true)
      window.setTimeout(() => setSaveSuccess(false), 2500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos guardar los cambios del negocio.'
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
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
            <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Dirección</label>
            <p className={isDark ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-slate-500'}>
              El bot de WhatsApp la usa para responder cuando un cliente pregunta dónde están ubicados.
            </p>
            <input value={direccion} onChange={(event) => setDireccion(event.target.value)} placeholder="Calle, número, colonia, ciudad" className={isDark ? 'mt-2 w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-white' : 'mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900'} />
          </div>
          <div>
            <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Referencias para llegar</label>
            <input value={referenciasDireccion} onChange={(event) => setReferenciasDireccion(event.target.value)} placeholder="Ej. frente al parque, junto a la farmacia" className={isDark ? 'mt-2 w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-white' : 'mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900'} />
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
          </div>
        </div>
      </div>

      <div className={isDark ? 'mt-5 flex flex-col items-start justify-between gap-3 border-t border-slate-700 pt-5 sm:flex-row sm:items-center' : 'mt-5 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center'}>
        <div className="flex-1">
          <p className={isDark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>
            Este botón guarda todos los cambios de esta sección: nombre, zona horaria, ubicación y prompt de IA.
          </p>
          {saveError && (
            <div className={isDark ? 'mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200' : 'mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'}>
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className={isDark ? 'mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200' : 'mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700'}>
              Cambios guardados correctamente.
            </div>
          )}
        </div>
        <Button onClick={() => void handleSave()} disabled={isSaving} className="w-full px-5 py-2.5 text-sm sm:w-auto">{isSaving ? 'Guardando…' : 'Guardar todos los cambios'}</Button>
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
