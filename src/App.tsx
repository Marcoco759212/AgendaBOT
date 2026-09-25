import { motion } from 'framer-motion'
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, CreditCard, Plus, Settings2, Sparkles, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AnalyticsCharts from './features/dashboard/components/AnalyticsCharts'
import KpiCard from './features/dashboard/components/KpiCard'
import RecentActivity from './features/dashboard/components/RecentActivity'
import AppointmentList from './features/appointments/components/AppointmentList'
import AppointmentModal from './features/appointments/components/AppointmentModal'
import BusinessHoursSettings from './features/business/components/BusinessHoursSettings'
import BusinessSettingsForm from './features/business/components/BusinessSettingsForm'
import ServiceCatalog from './features/services/components/ServiceCatalog'
import CustomerList from './features/customers/components/CustomerList'
import LandingPage from './pages/landing/LandingPage'
import TermsPage from './pages/legal/TermsPage'
import PrivacyPage from './pages/legal/PrivacyPage'
import BillingSection from './features/billing/components/BillingSection'
import AccountSecuritySection from './features/auth/components/AccountSecuritySection'
import AuthScreen from './features/auth/components/AuthScreen'
import ForgotPasswordScreen from './features/auth/components/ForgotPasswordScreen'
import ResetPasswordScreen from './features/auth/components/ResetPasswordScreen'
import MyBusinessesList from './features/business/components/MyBusinessesList'
import TeamMembersList from './features/team/components/TeamMembersList'
import TeamInviteForm from './features/team/components/TeamInviteForm'
import Header from './layout/Header'
import Sidebar from './layout/Sidebar'
import { Button } from './shared/components/button'
import QuickCreateModal from './shared/components/QuickCreateModal'
import { useAppStore } from './store/useAppStore'
import type { Appointment, ViewName } from './types'

const mobileNavItems: { key: ViewName; label: string; icon: typeof BarChart3 }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'calendar', label: 'Agenda', icon: CalendarDays },
  { key: 'services', label: 'Servicios', icon: Sparkles },
  { key: 'billing', label: 'Billing', icon: CreditCard },
  { key: 'account', label: 'Cuenta', icon: ShieldCheck },
  { key: 'settings', label: 'Negocio', icon: Settings2 },
  { key: 'team', label: 'Equipo', icon: Sparkles },
]

const routeMap: Record<ViewName, string> = {
  landing: '/landing',
  dashboard: '/dashboard',
  calendar: '/dashboard/calendar',
  clients: '/dashboard/clients',
  services: '/dashboard/services',
  billing: '/dashboard/billing',
  account: '/dashboard/account',
  settings: '/dashboard/settings',
  team: '/dashboard/team',
}


const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildMonthGrid = (cursor: Date) => {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  // getDay() da 0=domingo..6=sabado; lo convertimos para que la semana inicie en lunes,
  // que es como ya se etiquetan los encabezados (Lun, Mar, Mie, Jue, Vie, Sab, Dom).
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - firstWeekday)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return { date, isCurrentMonth: date.getMonth() === month }
  })
}

function AppShell() {
  const { activeView, activeTenantId, tenants, setActiveView, setStatusFilter, statusFilter, theme, quickCreateType, setQuickCreateType, hydrateFromApi, appointments, setSelectedAppointmentId, analyticsKpis, dailyBookings, hourlyDemand, serviceMix, recentActivity, loadAnalytics, loadRecentActivity, user, dashboardError, setDashboardError } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const isDark = theme === 'dark'
  const activeTenantRole = String((tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? 'staff') || 'staff').toLowerCase()
  const canViewAnalytics = activeTenantRole === 'owner' || activeTenantRole === 'admin'
  const visibleMobileNavItems = mobileNavItems.filter((item) => {
    if (item.key === 'team' || item.key === 'settings') return activeTenantRole === 'owner' || activeTenantRole === 'admin'
    if (item.key === 'billing') return activeTenantRole === 'owner'
    return true
  })

  useEffect(() => {
    // Se agrega activeTenantId a las dependencias: antes esto solo corria una vez al montar
    // AppShell, asi que si cambiabas de negocio sin navegar a otra pagina (el switcher del
    // Header, o "Seleccionar" en Mis negocios), servicios/citas/clientes se quedaban con los
    // datos del negocio anterior hasta la siguiente navegacion.
    void hydrateFromApi()
  }, [hydrateFromApi, activeTenantId])

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      if (canViewAnalytics) {
        void loadAnalytics('30d')
      }
      void loadRecentActivity(10)
    }
    // activeTenantId en las dependencias: sin esto, cambiar de negocio mientras ya estas en el
    // Dashboard no recargaba KPIs ni actividad reciente, porque location.pathname no cambia.
  }, [location.pathname, loadAnalytics, loadRecentActivity, canViewAnalytics, activeTenantId])

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

  const [calendarCursor, setCalendarCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null)

  useEffect(() => {
    // Al cambiar de negocio, el dia seleccionado de un negocio anterior ya no aplica.
    setSelectedCalendarDay(null)
  }, [activeTenantId])

  const todayKey = useMemo(() => toDateKey(new Date()), [])
  const calendarDays = useMemo(() => buildMonthGrid(calendarCursor), [calendarCursor])

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    appointments
      .filter((appointment) => appointment.tenantId === activeTenantId)
      .forEach((appointment) => {
        const list = map.get(appointment.date) ?? []
        list.push(appointment)
        map.set(appointment.date, list)
      })
    return map
  }, [appointments, activeTenantId])

  const activeDayKey = selectedCalendarDay ?? todayKey
  const activeDayAppointments = useMemo(
    () => (appointmentsByDay.get(activeDayKey) ?? []).slice().sort((a, b) => a.time.localeCompare(b.time)),
    [appointmentsByDay, activeDayKey],
  )

  const goToPreviousMonth = () => setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const goToNextMonth = () => setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  const goToCurrentMonth = () => {
    const now = new Date()
    setCalendarCursor(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedCalendarDay(null)
  }

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

              {dashboardError && (
                <div className={isDark ? 'mb-5 flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200' : 'mb-5 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700'}>
                  <span>{dashboardError}</span>
                  <button
                    type="button"
                    onClick={() => setDashboardError(null)}
                    className={isDark ? 'shrink-0 rounded-full border border-rose-400/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-200' : 'shrink-0 rounded-full border border-rose-300 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-700'}
                  >
                    Cerrar
                  </button>
                </div>
              )}

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
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className={isDark ? 'text-[10px] uppercase tracking-[0.24em] text-slate-400' : 'text-[10px] uppercase tracking-[0.24em] text-slate-500'}>Vista mensual</p>
                        <h3 className={isDark ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-900'}>Calendario inteligente</h3>
                      </div>
                      <div className={isDark ? 'flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-violet-200' : 'flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-violet-700'}>
                        <Sparkles className="h-3 w-3" />
                        IA asistiendo
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={goToPreviousMonth}
                        aria-label="Mes anterior"
                        className={isDark ? 'flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-slate-600 hover:text-white' : 'flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900'}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={goToCurrentMonth}
                        className={isDark ? 'text-sm font-medium capitalize text-white transition hover:text-emerald-300' : 'text-sm font-medium capitalize text-slate-900 transition hover:text-emerald-600'}
                      >
                        {calendarCursor.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                      </button>

                      <button
                        type="button"
                        onClick={goToNextMonth}
                        aria-label="Mes siguiente"
                        className={isDark ? 'flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-slate-600 hover:text-white' : 'flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900'}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
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
                        {calendarDays.map(({ date, isCurrentMonth }) => {
                          const dateKey = toDateKey(date)
                          const dayAppointments = appointmentsByDay.get(dateKey) ?? []
                          const isToday = dateKey === todayKey
                          const isSelected = dateKey === activeDayKey
                          const statusesPresent = Array.from(new Set(dayAppointments.map((appointment) => appointment.status)))

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              onClick={() => setSelectedCalendarDay(dateKey)}
                              className={`flex h-12 flex-col items-center justify-center gap-1 rounded-xl border text-xs transition-all ${
                                isSelected
                                  ? isDark
                                    ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.18)]'
                                    : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 shadow-[0_0_18px_rgba(16,185,129,0.12)]'
                                  : isToday
                                    ? isDark
                                      ? 'border-violet-400/50 bg-violet-500/10 text-violet-100'
                                      : 'border-violet-400/60 bg-violet-50 text-violet-800'
                                    : isDark
                                      ? 'border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800'
                              } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                            >
                              <span>{date.getDate()}</span>
                              {statusesPresent.length > 0 && (
                                <span className="flex items-center gap-0.5">
                                  {statusesPresent.slice(0, 3).map((status) => (
                                    <span
                                      key={status}
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        status === 'confirmed' ? 'bg-emerald-400' : status === 'cancelled' ? 'bg-rose-400' : 'bg-amber-400'
                                      }`}
                                    />
                                  ))}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className={isDark ? 'mt-5 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4' : 'mt-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm'}>
                      <div className="flex items-center justify-between">
                        <p className={isDark ? 'text-sm font-medium text-white' : 'text-sm font-medium text-slate-900'}>
                          {selectedCalendarDay ? `Citas del ${new Date(`${activeDayKey}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}` : 'Citas de hoy'}
                        </p>
                        <ChevronRight className={isDark ? 'h-4 w-4 text-slate-400' : 'h-4 w-4 text-slate-500'} />
                      </div>
                      <div className="mt-3 space-y-2">
                        {activeDayAppointments.length === 0 && (
                          <p className={isDark ? 'rounded-xl border border-slate-700 px-3 py-2.5 text-sm text-slate-400' : 'rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-500'}>
                            Sin citas registradas para este día.
                          </p>
                        )}
                        {activeDayAppointments.map((appointment) => (
                          <button
                            key={appointment.id}
                            type="button"
                            onClick={() => setSelectedAppointmentId(appointment.id)}
                            className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                              appointment.status === 'confirmed'
                                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 hover:border-emerald-500/40 dark:text-emerald-100'
                                : appointment.status === 'cancelled'
                                  ? 'border-rose-500/25 bg-rose-500/10 text-rose-700 hover:border-rose-500/40 dark:text-rose-100'
                                  : 'border-amber-500/25 bg-amber-500/10 text-amber-700 hover:border-amber-500/40 dark:text-amber-100'
                            }`}
                          >
                            {appointment.time} • {appointment.customer.name} — {appointment.service}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {location.pathname === '/dashboard/calendar' && (
                <section className="mt-4">
                  <BusinessHoursSettings />
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

              {location.pathname === '/dashboard/clients' && <CustomerList />}

              {location.pathname === '/dashboard/billing' && <BillingSection />}

              {location.pathname === '/dashboard/account' && (
                <div className="space-y-5">
                  <section className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-6' : 'rounded-2xl border border-slate-300 bg-white p-6 shadow-sm'}>
                    <div className="flex items-center gap-4">
                      <div className={isDark ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-lg font-semibold text-emerald-300' : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700'}>
                        {(user.name || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Mi cuenta</p>
                        <h2 className={isDark ? 'mt-1 text-2xl font-semibold text-white' : 'mt-1 text-2xl font-semibold text-slate-900'}>{user.name || 'Usuario'}</h2>
                        <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-600'}>{user.email}</p>
                      </div>
                    </div>
                  </section>

                  <MyBusinessesList />
                  <AccountSecuritySection />
                </div>
              )}

              {location.pathname === '/dashboard/settings' && (activeTenantRole === 'owner' || activeTenantRole === 'admin') && (
                <section className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-6' : 'rounded-2xl border border-slate-300 bg-white p-6 shadow-sm'}>
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                      <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Configuración del negocio</p>
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
            {visibleMobileNavItems.map(({ key, label, icon: Icon }) => (
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
                {visibleMobileNavItems.map(({ key, label, icon: Icon }) => (
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
      <Route path="/terminos" element={<TermsPage />} />
      <Route path="/privacidad" element={<PrivacyPage />} />
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
