import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { Button } from '../../../shared/components/button'
import SelectMenu from '../../../shared/components/SelectMenu'
import DatePicker from '../../../shared/components/DatePicker'
import TimePicker from '../../../shared/components/TimePicker'

function AppointmentModal() {
  const {
    appointments,
    services,
    selectedAppointmentId,
    setSelectedAppointmentId,
    cancelAppointment,
    editAppointment,
    lastAppointmentError,
    setLastAppointmentError,
    theme,
  } = useAppStore()
  const isDark = theme === 'dark'
  const appointment = appointments.find((item) => item.id === selectedAppointmentId)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [form, setForm] = useState({ date: '', time: '', serviceId: '', amount: '' })

  useEffect(() => {
    if (appointment) {
      setForm({
        date: appointment.date,
        time: appointment.time,
        serviceId: appointment.serviceId ?? services.find((service) => service.name === appointment.service)?.id ?? '',
        amount: String(appointment.amount),
      })
    }
    setIsEditing(false)
    setCancelError('')
    setLastAppointmentError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id])

  if (!appointment) return null

  const handleCancel = async () => {
    setIsCancelling(true)
    setCancelError('')
    try {
      await cancelAppointment(appointment.id)
      setSelectedAppointmentId(null)
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'No pudimos cancelar la cita.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleSave = async () => {
    const dateChanged = form.date !== appointment.date
    const timeChanged = form.time !== appointment.time
    const serviceChanged = form.serviceId !== (appointment.serviceId ?? '')
    const amountChanged = Number(form.amount) !== appointment.amount

    const patch: { date?: string; time?: string; serviceId?: string; amount?: number } = {}

    // El backend requiere fecha+hora juntas cuando cambia el dia, la hora o el servicio
    // (revalida disponibilidad real contra la duracion del servicio). Una edicion de precio
    // sola, en cambio, no debe mandar fecha/hora: asi evita re-chequear disponibilidad y
    // mover el evento de Calendar sin necesidad.
    if (dateChanged || timeChanged || serviceChanged) {
      patch.date = form.date
      patch.time = form.time
      if (serviceChanged) patch.serviceId = form.serviceId
    }

    if (amountChanged) {
      patch.amount = Number(form.amount)
    }

    if (Object.keys(patch).length === 0) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    setLastAppointmentError(null)

    try {
      await editAppointment(appointment.id, patch)
      setIsEditing(false)
    } catch {
      // el mensaje ya queda visible via lastAppointmentError, mostrado abajo
    } finally {
      setIsSaving(false)
    }
  }

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

          {!isEditing ? (
            <div className={isDark ? 'rounded-2xl border border-slate-800 bg-slate-950/60 p-4' : 'rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
              <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Servicio</p>
              <p className={isDark ? 'mt-2 text-lg font-medium text-white' : 'mt-2 text-lg font-medium text-slate-900'}>{appointment.service}</p>
              <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{appointment.date} • {appointment.time}</p>
              <p className="text-sm text-emerald-300">${appointment.amount.toLocaleString()} MXN</p>
            </div>
          ) : (
            <div className={isDark ? 'space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4' : 'space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
              <div>
                <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Servicio</label>
                <div className="mt-1">
                  <SelectMenu
                    value={form.serviceId}
                    options={services.map((service) => ({ value: service.id, label: service.name }))}
                    onChange={(serviceId) => setForm((current) => ({ ...current, serviceId }))}
                    isDark={isDark}
                    placeholder="Selecciona un servicio"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Fecha</label>
                  <div className="mt-1">
                    <DatePicker value={form.date} onChange={(date) => setForm((current) => ({ ...current, date }))} isDark={isDark} />
                  </div>
                </div>
                <div>
                  <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Hora</label>
                  <div className="mt-1">
                    <TimePicker value={form.time} onChange={(time) => setForm((current) => ({ ...current, time }))} isDark={isDark} />
                  </div>
                </div>
              </div>
              <div>
                <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Precio (MXN)</label>
                <input
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  className={isDark ? 'mt-1 w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white' : 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900'}
                />
              </div>
            </div>
          )}
        </div>

        {lastAppointmentError && (
          <div className={isDark ? 'mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200' : 'mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'}>
            {lastAppointmentError}
          </div>
        )}

        {cancelError && (
          <div className={isDark ? 'mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200' : 'mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'}>
            {cancelError}
          </div>
        )}

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
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setLastAppointmentError(null)
                  }}
                  className={isDark ? 'rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300' : 'rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700'}
                >
                  Cancelar edición
                </button>
                <Button onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCancelError('')
                    void handleCancel()
                  }}
                  disabled={isCancelling}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelando…' : 'Cancelar cita'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={isDark ? 'rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200' : 'rounded-xl border border-violet-300 bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700'}
                >
                  Editar cita
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentModal
