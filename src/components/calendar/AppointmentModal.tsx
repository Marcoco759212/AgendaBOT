import { X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

function AppointmentModal() {
  const { appointments, selectedAppointmentId, setSelectedAppointmentId, cancelAppointment, theme } = useAppStore()
  const isDark = theme === 'dark'
  const appointment = appointments.find((item) => item.id === selectedAppointmentId)

  if (!appointment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className={isDark ? 'w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl' : 'w-full max-w-xl rounded-3xl border border-slate-300 bg-white p-5 shadow-2xl'}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Detalle de la cita</p>
            <h3 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>{appointment.customer.name}</h3>
          </div>
          <button onClick={() => setSelectedAppointmentId(null)} className={isDark ? 'rounded-full border border-slate-600 p-2 text-slate-300' : 'rounded-full border border-slate-300 p-2 text-slate-600'}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={isDark ? 'rounded-2xl border border-slate-800 bg-slate-950/60 p-4' : 'rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
            <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Cliente</p>
            <p className={isDark ? 'mt-2 text-lg font-medium text-white' : 'mt-2 text-lg font-medium text-slate-900'}>{appointment.customer.name}</p>
            <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{appointment.customer.phone}</p>
            <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{appointment.customer.email}</p>
          </div>
          <div className={isDark ? 'rounded-2xl border border-slate-800 bg-slate-950/60 p-4' : 'rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
            <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Servicio</p>
            <p className={isDark ? 'mt-2 text-lg font-medium text-white' : 'mt-2 text-lg font-medium text-slate-900'}>{appointment.service}</p>
            <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{appointment.date} • {appointment.time}</p>
            <p className="text-sm text-emerald-300">${appointment.amount.toLocaleString()} MXN</p>
          </div>
        </div>

        <div className={isDark ? 'mt-5 rounded-2xl border border-slate-700 bg-slate-950/60 p-4' : 'mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-4'}>
          <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Notas de IA</p>
          <ul className={isDark ? 'mt-3 space-y-2 text-sm text-slate-300' : 'mt-3 space-y-2 text-sm text-slate-700'}>
            {appointment.notes.map((note, index) => (
              <li key={index} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-violet-400" />
                {note}
              </li>
            ))}
          </ul>
        </div>

        {appointment.status !== 'cancelled' && (
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => {
                void cancelAppointment(appointment.id)
                setSelectedAppointmentId(null)
              }}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200"
            >
              Cancelar cita
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentModal
