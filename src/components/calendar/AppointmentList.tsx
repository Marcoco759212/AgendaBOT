import { CalendarDays, CheckCheck, Clock3, MessageSquareText, MoreHorizontal, XCircle } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/utils'

const statusStyles = {
  confirmed: 'border-emerald-500/40 bg-emerald-100 text-emerald-800 shadow-sm',
  pending: 'border-amber-500/40 bg-amber-100 text-amber-800 shadow-sm',
  cancelled: 'border-rose-500/40 bg-rose-100 text-rose-800 shadow-sm',
}

function AppointmentList() {
  const { appointments, activeTenantId, statusFilter, setSelectedAppointmentId, cancelAppointment, theme } = useAppStore()
  const isDark = theme === 'dark'

  const filteredAppointments = appointments.filter((appointment) => {
    if (appointment.tenantId !== activeTenantId) return false
    if (statusFilter === 'all') return true
    return appointment.status === statusFilter
  })

  return (
    <div className="space-y-3">
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
            <button
              onClick={(event) => {
                event.stopPropagation()
                void cancelAppointment(appointment.id)
              }}
              className={isDark ? 'rounded-full border border-slate-600 p-1.5 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-200' : 'rounded-full border border-slate-300 p-1.5 text-slate-500 transition hover:border-rose-500/40 hover:text-rose-500'}
              aria-label="Cancelar cita"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AppointmentList
