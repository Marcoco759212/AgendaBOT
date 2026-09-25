import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createBusiness } from '../../api/business.api'
import { Button } from './button'
import { Modal } from './modal'
import { useAppStore } from '../../store/useAppStore'

interface QuickCreateModalProps {
  type: 'appointment' | 'service' | 'branch'
  open: boolean
  onClose: () => void
}

function QuickCreateModal({ type, open, onClose }: QuickCreateModalProps) {
  const {
    addAppointment,
    addCustomer,
    addService,
    addTenantFromServer,
    customers,
    services,
    loadCustomers,
    loadAvailability,
    availability,
    availabilityMessage,
    lastAppointmentError,
    theme,
  } = useAppStore()
  const isDark = theme === 'dark'
  const [form, setForm] = useState({
    title: '',
    customerId: '',
    serviceId: '',
    date: '',
    time: '',
    notes: '',
    price: '',
    duration: '',
    city: '',
    address: '',
  })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [newCustomer, setNewCustomer] = useState({ name: '', phoneNumber: '', email: '' })
  const [customerFormOpen, setCustomerFormOpen] = useState(false)
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false)
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingCustomer, setIsSavingCustomer] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!toast) return

    const timeoutId = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    if (type !== 'appointment' || !form.serviceId || !form.date) {
      return
    }

    void loadAvailability(form.serviceId, form.date)
  }, [type, form.serviceId, form.date, loadAvailability])

  const selectedService = useMemo(
    () => services.find((service) => service.id === form.serviceId) ?? services[0],
    [form.serviceId, services],
  )

  const timeSlots = useMemo(() => {
    if (availability.length > 0) {
      return availability.filter((slot) => slot.available).map((slot) => slot.start)
    }

    if (!selectedService) {
      return []
    }

    const duration = selectedService.duration ?? 45
    const slots: string[] = []
    const startHour = 9
    const endHour = 19

    for (let hour = startHour; hour <= endHour; hour += 1) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const timeValue = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
        const [h, m] = timeValue.split(':').map(Number)
        const endMinutes = h * 60 + m + duration

        if (endMinutes <= endHour * 60) {
          slots.push(timeValue)
        }
      }
    }

    return slots
  }, [availability, selectedService])

  const quickDateOptions = useMemo(() => {
    const today = new Date()
    const format = (date: Date) => date.toISOString().slice(0, 10)

    return [
      { label: 'Hoy', value: format(today) },
      { label: 'Mañana', value: format(new Date(today.getTime() + 86400000)) },
      { label: 'En 3 días', value: format(new Date(today.getTime() + 3 * 86400000)) },
    ]
  }, [])

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(calendarMonth),
    [calendarMonth],
  )

  const calendarDays = useMemo(() => {
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
    const startDay = new Date(monthStart)
    startDay.setDate(monthStart.getDate() - monthStart.getDay() + 1)

    const days: Date[] = []
    for (let index = 0; index < 42; index += 1) {
      const nextDay = new Date(startDay)
      nextDay.setDate(startDay.getDate() + index)
      days.push(nextDay)
    }

    return days
  }, [calendarMonth])

  const formatSelectedDate = (value: string) =>
    value ? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : 'Selecciona una fecha'

  const handleSelectDate = (nextDate: string) => {
    setForm((current) => ({ ...current, date: nextDate }))
    setCalendarOpen(false)
  }

  const handleSave = async () => {
    if (type === 'appointment') {
      const selectedCustomer = customers.find((customer) => customer.id === (form.customerId || customers[0]?.id)) ?? customers[0]
      const selectedService = services.find((service) => service.id === (form.serviceId || services[0]?.id)) ?? services[0]

      if (!selectedCustomer || !selectedService) {
        return
      }

      await addAppointment({
        id: `apt-${Date.now()}`,
        customerId: selectedCustomer.id,
        serviceId: selectedService.id,
        customer: selectedCustomer,
        service: selectedService.name,
        date: form.date || '2026-09-10',
        time: form.time || '10:00',
        status: 'pending',
        channel: 'WhatsApp',
        notes: [form.notes || 'Creada desde modal de creación rápida.'],
        amount: Number(form.price) || 1200,
      })

      if (lastAppointmentError) {
        return
      }
    }

    if (type === 'service') {
      const serviceName = form.title.trim()
      const duration = Number(form.duration)
      const price = Number(form.price)

      if (!serviceName || !Number.isFinite(duration) || !Number.isFinite(price)) {
        return
      }

      setIsSubmitting(true)
      setToast(null)

      try {
        await addService({
          id: `svc-${Date.now()}`,
          name: serviceName,
          duration,
          price,
          description: form.notes.trim() || 'Servicio creado desde el panel.',
          category: 'General',
        })
        setForm({ title: '', customerId: '', serviceId: '', date: '', time: '', notes: '', price: '', duration: '', city: '', address: '' })
        onClose()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No pudimos guardar el servicio.'
        setToast({ type: 'error', message })
      } finally {
        setIsSubmitting(false)
      }

      return
    }

    if (type === 'branch') {
      const businessName = form.title.trim()

      if (!businessName) {
        setToast({ type: 'error', message: 'Debes indicar el nombre del negocio.' })
        return
      }

      setIsSubmitting(true)
      setToast(null)

      try {
        const response = await createBusiness({
          nombre_negocio: businessName,
          timezone: 'America/Mexico_City',
        })

        const tenantPayload = (response as { tenant?: Record<string, unknown> } | undefined)?.tenant ?? response
        const tenant = tenantPayload && typeof tenantPayload === 'object' && 'id' in tenantPayload ? tenantPayload : null

        if (!tenant || typeof tenant.id !== 'string' || !tenant.id) {
          throw new Error('La respuesta del backend no devolvió un negocio válido.')
        }

        addTenantFromServer(tenant)
        setToast({ type: 'success', message: 'Negocio agregado correctamente. Selecciónalo en el menú "Tenant" para configurarlo.' })
        setForm({ title: '', customerId: '', serviceId: '', date: '', time: '', notes: '', price: '', duration: '', city: '', address: '' })
        onClose()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No pudimos crear el negocio adicional.'
        setToast({ type: 'error', message })
      } finally {
        setIsSubmitting(false)
      }

      return
    }

    setForm({ title: '', customerId: '', serviceId: '', date: '', time: '', notes: '', price: '', duration: '', city: '', address: '' })
    onClose()
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-h-[85vh]"
      title={
        type === 'appointment' ? 'Nueva cita' : type === 'service' ? 'Agregar servicio' : 'Agregar otro negocio'
      }
      subtitle={type === 'branch' ? 'Crea un negocio adicional con su propio calendario, servicios y equipo.' : 'Completa los datos para añadirlo al sistema de forma inmediata.'}
    >
      <div className="max-h-[70vh] space-y-3 overflow-y-auto px-[3px]">
        {type === 'appointment' && (
          <>
            <label className={isDark ? 'block text-xs uppercase tracking-[0.2em] text-slate-400' : 'block text-xs uppercase tracking-[0.2em] text-slate-500'}>Cliente</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCustomerMenuOpen((open) => !open)}
                className={isDark ? 'flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-3 text-left text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'flex w-full items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-left text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'}
              >
                <span className={form.customerId ? (isDark ? 'text-white' : 'text-slate-900') : isDark ? 'text-slate-400' : 'text-slate-500'}>
                  {customers.find((customer) => customer.id === form.customerId)?.name || 'Selecciona un cliente'}
                </span>
                <ChevronDown className={isDark ? 'h-4 w-4 text-slate-400' : 'h-4 w-4 text-slate-500'} />
              </button>

              {customerMenuOpen && (
                <div className={isDark ? 'absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-[0_20px_35px_rgba(15,23,42,0.7)]' : 'absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0_20px_35px_rgba(15,23,42,0.08)]'}>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMenuOpen(false)
                      setCustomerFormOpen(true)
                    }}
                    className={isDark ? 'flex w-full items-center justify-between border-b border-slate-700 bg-slate-900/80 px-3 py-3 text-left text-sm text-slate-200 hover:bg-slate-800' : 'flex w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100'}
                  >
                    <span>+ Nuevo cliente</span>
                  </button>
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setCustomerMenuOpen(false)
                        setCustomerFormOpen(false)
                        setForm((current) => ({ ...current, customerId: customer.id }))
                      }}
                      className={isDark ? `w-full px-3 py-3 text-left text-sm ${form.customerId === customer.id ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800'}` : `w-full px-3 py-3 text-left text-sm ${form.customerId === customer.id ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      {customer.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {customerFormOpen && (
              <div className={isDark ? 'space-y-2 rounded-2xl border border-slate-700 bg-slate-950/60 p-3' : 'space-y-2 rounded-2xl border border-slate-300 bg-slate-50 p-3'}>
                <input
                  value={newCustomer.name}
                  onChange={(event) => setNewCustomer((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nombre del cliente"
                  className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900/70 p-2.5 text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={newCustomer.phoneNumber}
                    onChange={(event) => setNewCustomer((current) => ({ ...current, phoneNumber: event.target.value }))}
                    placeholder="Teléfono"
                    className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900/70 p-2.5 text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'}
                  />
                  <input
                    value={newCustomer.email}
                    onChange={(event) => setNewCustomer((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Correo (opcional)"
                    className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900/70 p-2.5 text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerFormOpen(false)
                      setNewCustomer({ name: '', phoneNumber: '', email: '' })
                    }}
                    className={isDark ? 'rounded-xl border border-slate-700 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300' : 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-700'}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isSavingCustomer}
                    onClick={async () => {
                      if (!newCustomer.name.trim() || !newCustomer.phoneNumber.trim()) return

                      setIsSavingCustomer(true)
                      setToast(null)

                      try {
                        const createdCustomer = await addCustomer({
                          nombre: newCustomer.name,
                          phoneNumber: newCustomer.phoneNumber,
                          email: newCustomer.email,
                        })

                        setForm((current) => ({ ...current, customerId: createdCustomer.id }))
                        setCustomerFormOpen(false)
                        setNewCustomer({ name: '', phoneNumber: '', email: '' })
                      } catch (error) {
                        const message = error instanceof Error ? error.message : 'No pudimos guardar el cliente.'
                        setToast({ type: 'error', message })
                      } finally {
                        setIsSavingCustomer(false)
                      }
                    }}
                    className={isDark ? 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-emerald-200 disabled:opacity-50' : 'rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-2 text-xs uppercase tracking-[0.18em] text-emerald-700 disabled:opacity-50'}
                  >
                    {isSavingCustomer ? 'Guardando…' : 'Guardar cliente'}
                  </button>
                </div>
              </div>
            )}

            <label className={isDark ? 'block text-xs uppercase tracking-[0.2em] text-slate-400' : 'block text-xs uppercase tracking-[0.2em] text-slate-500'}>Servicio</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setServiceMenuOpen((open) => !open)}
                className={isDark ? 'flex w-full items-center justify-between rounded-xl border border-emerald-500/60 bg-slate-900/70 px-3 py-3 text-left text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'flex w-full items-center justify-between rounded-xl border border-emerald-400 bg-slate-50 px-3 py-3 text-left text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'}
              >
                <span className={form.serviceId ? (isDark ? 'text-white' : 'text-slate-900') : isDark ? 'text-slate-400' : 'text-slate-500'}>
                  {services.find((service) => service.id === form.serviceId)?.name || 'Selecciona un servicio'}
                </span>
                <ChevronDown className={isDark ? 'h-4 w-4 text-slate-400' : 'h-4 w-4 text-slate-500'} />
              </button>

              {serviceMenuOpen && (
                <div className={isDark ? 'absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-[0_20px_35px_rgba(15,23,42,0.7)]' : 'absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0_20px_35px_rgba(15,23,42,0.08)]'}>
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setForm((current) => ({ ...current, serviceId: service.id }))
                        setServiceMenuOpen(false)
                      }}
                      className={isDark ? `w-full px-3 py-3 text-left text-sm ${form.serviceId === service.id ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800'}` : `w-full px-3 py-3 text-left text-sm ${form.serviceId === service.id ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      {service.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={isDark ? 'space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3' : 'space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3'}>
              <div className="flex items-center justify-between">
                <label className={isDark ? 'block text-xs uppercase tracking-[0.2em] text-slate-400' : 'block text-xs uppercase tracking-[0.2em] text-slate-500'}>Fecha</label>
                <span className={isDark ? 'text-[10px] uppercase tracking-[0.18em] text-emerald-300' : 'text-[10px] uppercase tracking-[0.18em] text-emerald-600'}>{selectedService ? `${selectedService.duration} min` : 'Agenda'}</span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCalendarOpen((open) => !open)}
                  className={isDark ? 'flex w-full items-center justify-between rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-3 text-left text-sm text-white shadow-inner shadow-slate-950/40 transition hover:border-emerald-500/40' : 'flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-3 text-left text-sm text-slate-800 shadow-inner transition hover:border-emerald-500/40'}
                >
                  <span className={form.date ? (isDark ? 'text-white' : 'text-slate-900') : isDark ? 'text-slate-400' : 'text-slate-500'}>{form.date ? formatSelectedDate(form.date) : 'Selecciona una fecha'}</span>
                  <CalendarDays className={isDark ? 'h-4 w-4 text-emerald-300' : 'h-4 w-4 text-emerald-600'} />
                </button>

                {calendarOpen && (
                  <div className={isDark ? 'absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-slate-600 bg-slate-950/95 p-3 shadow-[0_20px_45px_rgba(15,23,42,0.8)] backdrop-blur-xl' : 'absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl'}>
                    <div className="mb-3 flex items-center justify-between">
                      <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className={isDark ? 'rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:border-slate-500' : 'rounded-lg border border-slate-300 bg-slate-100 p-1.5 text-slate-700 hover:border-slate-400'}>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className={isDark ? 'text-sm font-medium capitalize text-white' : 'text-sm font-medium capitalize text-slate-800'}>{monthLabel}</span>
                      <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className={isDark ? 'rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:border-slate-500' : 'rounded-lg border border-slate-300 bg-slate-100 p-1.5 text-slate-700 hover:border-slate-400'}>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className={isDark ? 'mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.18em] text-slate-400' : 'mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.18em] text-slate-500'}>
                      {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((day) => (
                        <div key={day} className="py-1.5">{day}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day) => {
                        const value = day.toISOString().slice(0, 10)
                        const isCurrentMonth = day.getMonth() === calendarMonth.getMonth()
                        const isSelected = form.date === value
                        const isPast = day < new Date(new Date().toDateString())

                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={isPast || !isCurrentMonth}
                            onClick={() => handleSelectDate(value)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition ${
                              isSelected
                                ? isDark
                                  ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                  : 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                : isPast
                                  ? isDark
                                    ? 'cursor-not-allowed text-slate-600'
                                    : 'cursor-not-allowed text-slate-300'
                                  : isCurrentMonth
                                    ? isDark
                                      ? 'text-slate-200 hover:bg-slate-800'
                                      : 'text-slate-700 hover:bg-slate-100'
                                    : isDark
                                      ? 'text-slate-500'
                                      : 'text-slate-400'
                            }`}
                          >
                            {day.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {quickDateOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, date: option.value }))}
                    className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                      form.date === option.value
                        ? isDark
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                          : 'border-emerald-300 bg-emerald-100 text-emerald-700'
                        : isDark
                          ? 'border-slate-700 bg-slate-900/80 text-slate-300'
                          : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={isDark ? 'space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3' : 'space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3'}>
              <div className="flex items-center justify-between">
                <label className={isDark ? 'block text-xs uppercase tracking-[0.2em] text-slate-400' : 'block text-xs uppercase tracking-[0.2em] text-slate-500'}>Horario</label>
                <span className={isDark ? 'text-[10px] uppercase tracking-[0.18em] text-violet-300' : 'text-[10px] uppercase tracking-[0.18em] text-violet-600'}>Disponibilidad</span>
              </div>

              {availabilityMessage && (
                <div className={isDark ? 'rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100' : 'rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700'}>{availabilityMessage}</div>
              )}

              {timeSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((time, index) => (
                    <button
                      key={`${time}-${index}`}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, time }))}
                      className={`rounded-full border px-2.5 py-1.5 text-xs transition ${
                        (form.time ? form.time === time : index === 0)
                          ? isDark
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.12)]'
                            : 'border-emerald-300 bg-emerald-100 text-emerald-700 shadow-[0_0_18px_rgba(16,185,129,0.08)]'
                          : isDark
                            ? 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-200'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : !availabilityMessage ? (
                <div className={isDark ? 'rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-400' : 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-500'}>Selecciona una fecha y servicio para cargar horarios.</div>
              ) : null}
            </div>

            {lastAppointmentError && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {lastAppointmentError}
              </div>
            )}

            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Precio estimado" className={isDark ? 'ml-[3px] w-[calc(100%-3px)] rounded-xl border border-slate-600 bg-slate-900/70 p-3 text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'ml-[3px] w-[calc(100%-3px)] rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'} />
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas de IA o detalles adicionales" className={isDark ? 'ml-[3px] min-h-[90px] w-[calc(100%-3px)] rounded-xl border border-slate-600 bg-slate-900/70 p-3 text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'ml-[3px] min-h-[90px] w-[calc(100%-3px)] rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'} />
          </>
        )}

        {type === 'service' && (
          <>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nombre del servicio" className={isDark ? 'ml-[3px] w-[calc(100%-3px)] rounded-xl border border-slate-600 bg-slate-900/70 p-3 text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'ml-[3px] w-[calc(100%-3px)] rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duración (min)" className={isDark ? 'ml-[3px] w-[calc(100%-3px)] rounded-xl border border-slate-600 bg-slate-900/70 p-3 text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'ml-[3px] w-[calc(100%-3px)] rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'} />
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Precio" className={isDark ? 'ml-[3px] w-[calc(100%-3px)] rounded-xl border border-slate-600 bg-slate-900/70 p-3 text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'ml-[3px] w-[calc(100%-3px)] rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'} />
            </div>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Descripción del servicio" className={isDark ? 'ml-[3px] min-h-[110px] w-[calc(100%-3px)] rounded-xl border border-slate-600 bg-slate-900/70 p-3 text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'ml-[3px] min-h-[110px] w-[calc(100%-3px)] rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'} />
          </>
        )}

        {type === 'branch' && (
          <>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nombre del negocio" className={isDark ? 'ml-[3px] w-[calc(100%-3px)] rounded-xl border border-slate-600 bg-slate-900/70 p-3 text-sm text-white transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' : 'ml-[3px] w-[calc(100%-3px)] rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'} />
            <div className={isDark ? 'rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-300' : 'rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600'}>
              Este negocio se crea con su propio calendario, servicios y equipo, sin compartir datos con el negocio actual.
            </div>
          </>
        )}

        {toast && (
          <div className={toast.type === 'error' ? 'rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200'}>
            {toast.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => void handleSave()} disabled={isSubmitting}>
            {isSubmitting ? 'Creando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default QuickCreateModal
