import { CalendarDays, CheckCheck, Clock3, MessageSquareText, MoreHorizontal, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'
import { useAppStore } from '../../../store/useAppStore'

const statusStyles = {
  confirmed: 'border-emerald-500/40 bg-emerald-100 text-emerald-800 shadow-sm',
  pending: 'border-amber-500/40 bg-amber-100 text-amber-800 shadow-sm',
  cancelled: 'border-rose-500/40 bg-rose-100 text-rose-800 shadow-sm',
}

function AppointmentList() {
  const { appointments, activeTenantId, statusFilter, setSelectedAppointmentId, cancelAppointment, theme } = useAppStore()
  const isDark = theme === 'dark'
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const activeMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openMenuId) return

    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuRef.current && !activeMenuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  const handleCancel = async (appointmentId: string) => {
    setOpenMenuId(null)
    setCancellingId(appointmentId)
    setCancelError(null)
    try {
      await cancelAppointment(appointmentId)
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'No pudimos cancelar la cita.')
    } finally {
      setCancellingId(null)
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    if (appointment.tenantId !== activeTenantId) return false
    if (statusFilter === 'all') return true
    return appointment.status === statusFilter
  })

  return (
    <div className="space-y-3">
      {cancelError && (
        <div className={isDark ? 'rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200' : 'rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'}>
          {cancelError}
        </div>
      )}
      {filteredAppointments.map((appointment) => (
        <div key={appointment.id} className={isDark ? 'flex w-full items-start gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-3 text-left transition hover:border-slate-600 hover:bg-slate-900' : 'flex w-full items-start gap-3 rounded-2xl border border-slate-300 bg-white p-3 text-left shadow-sm transition hover:border-slate-400 hover:bg-slate-50'}>
          <button onClick={() => setSelectedAppointmentId(appointment.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
            <div className={isDark ? 'flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-200' : 'flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700'}>
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className={isDark ? 'truncate text-sm font-medium text-white' : 'truncate text-sm font-medium text-slate-900'}>{appointment.customer.name}</h4>
                <span className={cn('rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.16em]', isDark ? statusStyles[appointment.status] : statusStyles[appointment.status].replace('shadow-sm', 'shadow-none'))}>
                  {appointment.status}
                </span>
              </div>
              <p className={isDark ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-slate-500'}>{appointment.service}</p>
              <div className={isDark ? 'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400' : 'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500'}>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> {appointment.date} • {appointment.time}</span>
                <span className="inline-flex items-center gap-1"><MessageSquareText className="h-3 w-3" /> {appointment.channel}</span>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <div className={isDark ? 'rounded-full border border-slate-600 p-1.5 text-slate-300' : 'rounded-full border border-slate-300 p-1.5 text-slate-600'}>
              {appointment.status === 'confirmed' ? <CheckCheck className="h-3.5 w-3.5" /> : appointment.status === 'cancelled' ? <XCircle className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            </div>
            <div ref={openMenuId === appointment.id ? activeMenuRef : undefined} className="relative">
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  setOpenMenuId((current) => (current === appointment.id ? null : appointment.id))
                }}
                disabled={cancellingId === appointment.id}
                className={isDark ? 'rounded-full border border-slate-600 p-1.5 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-200 disabled:opacity-50' : 'rounded-full border border-slate-300 p-1.5 text-slate-500 transition hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-50'}
                aria-label="Más opciones"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {openMenuId === appointment.id && (
                <div
                  role="tooltip"
                  onClick={(event) => event.stopPropagation()}
                  className={isDark
                    ? 'absolute right-0 top-full z-30 mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-[0_18px_35px_rgba(2,6,23,0.55)]'
                    : 'absolute right-0 top-full z-30 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_18px_35px_rgba(15,23,42,0.12)]'}
                >
                  <div className={cn('absolute -top-1.5 right-3 h-3 w-3 rotate-45 border-l border-t', isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white')} />
                  <button
                    type="button"
                    onClick={() => void handleCancel(appointment.id)}
                    disabled={cancellingId === appointment.id}
                    className={isDark
                      ? 'w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-50'
                      : 'w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50'}
                  >
                    {cancellingId === appointment.id ? 'Cancelando…' : 'Cancelar cita'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AppointmentList
