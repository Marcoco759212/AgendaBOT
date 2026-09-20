import { create } from 'zustand'
import { apiRequest, API_BASE_URL, changePassword, forgotPassword, listTeamMembers, removeTeamMember, resetPassword, updateTeamMemberRole } from '../lib/api'
import type { Appointment, AvailabilitySlot, BillingCycle, BillingInvoice, BillingPlan, Customer, CustomerDetail, PlanName, RecentActivityItem, Service, Tenant, ViewName } from '../types'

interface UserProfile {
  id?: string
  name: string
  email: string
  role: string
}

interface UsageMetric {
  id: 'conversations' | 'branches' | 'calendars'
  label: string
  used: number
  limit: number
  color: string
}

type ServicePatch = Partial<Service> & { activo?: boolean }

type AppointmentInput = Omit<Appointment, 'tenantId'> & {
  tenantId?: string
  customerId?: string
  serviceId?: string
}

interface AppState {
  user: UserProfile
  tenants: Tenant[]
  customers: Customer[]
  activeTenantId: string
  isAuthenticated: boolean
  isSessionReady: boolean
  activeView: ViewName
  appointments: Appointment[]
  services: Service[]
  selectedAppointmentId: string | null
  statusFilter: 'all' | 'confirmed' | 'pending' | 'cancelled'
  theme: 'dark' | 'light'
  activeBillingCycle: BillingCycle
  selectedPlanId: string
  billingPlan: BillingPlan
  billingInvoices: BillingInvoice[]
  isBillingModalOpen: boolean
  quickCreateType: 'appointment' | 'service' | 'branch' | null
  usageMetrics: UsageMetric[]
  availability: AvailabilitySlot[]
  availabilityMessage: string | null
  lastAppointmentError: string | null
  analyticsKpis: Array<{ id: string; label: string; value: string; delta: string; positive: boolean; accent: 'emerald' | 'violet' | 'amber' | 'rose' }>
  dailyBookings: Array<{ day: string; bookings: number }>
  hourlyDemand: Array<{ hour: string; demand: number }>
  serviceMix: Array<{ name: string; value: number; color: string }>
  recentActivity: RecentActivityItem[]
  customerDetail: CustomerDetail | null
  isHydrated: boolean

  setActiveTenant: (tenantId: string) => void
  restoreSession: () => Promise<void>
  login: (email: string, password: string) => Promise<Tenant[]>
  register: (payload: { email: string; password: string; nombre_negocio: string; nombre_usuario: string; timezone?: string }) => Promise<Tenant[]>
  logout: () => void
  setActiveView: (view: ViewName) => void
  setTheme: (theme: 'dark' | 'light') => void
  setSelectedAppointmentId: (appointmentId: string | null) => void
  setStatusFilter: (filter: 'all' | 'confirmed' | 'pending' | 'cancelled') => void
  setBillingCycle: (cycle: BillingCycle) => void
  setSelectedPlan: (planId: string) => void
  setBillingPlan: (planName: PlanName) => void
  setBillingModalOpen: (open: boolean) => void
  setQuickCreateType: (type: 'appointment' | 'service' | 'branch' | null) => void
  updateUsageMetric: (id: UsageMetric['id'], used: number, limit: number) => void
  hydrateFromApi: () => Promise<void>
  loadCustomers: () => Promise<void>
  loadCustomerDetail: (customerId: string) => Promise<void>
  loadAnalytics: (range?: '7d' | '30d' | '90d') => Promise<void>
  loadRecentActivity: (limit?: number) => Promise<void>
  loadAvailability: (serviceId: string, date: string) => Promise<void>
  setLastAppointmentError: (message: string | null) => void
  setAvailabilityMessage: (message: string | null) => void
  addCustomer: (data: { nombre: string; phoneNumber: string; email?: string }) => Promise<Customer>
  updateBusiness: (business: Partial<Tenant> & { nombre?: string; timezone?: string; horario_atencion?: Record<string, unknown>; prompt_custom_ia?: string; google_calendar_id?: string }) => Promise<void>
  forgotPassword: (email: string) => Promise<string>
  resetPassword: (payload: { token: string; new_password: string }) => Promise<string>
  changePassword: (payload: { current_password: string; new_password: string }) => Promise<string>
  listTeamMembers: (tenantId: string) => Promise<Array<{ id: string; email: string; nombre: string; role: 'owner' | 'admin' | 'staff' }>>
  updateTeamMemberRole: (payload: { tenant_id: string; user_id: string; role: 'admin' | 'staff' }) => Promise<{ user_id: string; role: 'admin' | 'staff' }>
  removeTeamMember: (payload: { tenant_id: string; user_id: string }) => Promise<string>
  inviteTeamMember: (member: { nombre: string; email: string; password: string; role: 'admin' | 'staff' }) => Promise<{ created: boolean; user: { id: string; email: string; nombre: string }; role: 'admin' | 'staff'; password: string }>
  updateService: (serviceId: string, patch: ServicePatch) => Promise<void>
  cancelAppointment: (appointmentId: string) => Promise<void>
  addService: (service: Service) => Promise<void>
  addAppointment: (appointment: AppointmentInput) => Promise<void>
  addTenant: (tenant: Tenant) => void
}

const getActiveTenantId = () => {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('agendabot_active_tenant_id') ?? ''
}

const fallbackTenants: Tenant[] = [
  {
    id: getActiveTenantId() || 'tenant-demo',
    name: 'Estudio Centro',
    city: 'Ciudad de México',
    speciality: 'Belleza y estética',
    address: 'Av. Reforma 1250',
    active: true,
    calendarLinked: true,
  },
  {
    id: 'tenant-2',
    name: 'Consultorio Pedregal',
    city: 'Álvaro Obregón',
    speciality: 'Salud y medicina estética',
    address: 'Camino Real 220',
    active: false,
    calendarLinked: true,
  },
]

const fallbackCustomers: Customer[] = [
  {
    id: 'cus-demo-1',
    name: 'María López',
    phone: '+52 55 2345 6120',
    email: 'maria.lopez@email.com',
    avatar: 'ML',
  },
  {
    id: 'cus-demo-2',
    name: 'Sofía Ramírez',
    phone: '+52 55 2990 2715',
    email: 'sofia.r@email.com',
    avatar: 'SR',
  },
]

const fallbackServices: Service[] = [
  {
    id: 'svc-demo-1',
    name: 'Limpieza Dental Premium',
    duration: 45,
    price: 1200,
    description: 'Limpieza integral con diagnóstico de salud bucal y revisión visual.',
    category: 'Salud',
  },
  {
    id: 'svc-demo-2',
    name: 'Corte de Cabello + Styling',
    duration: 60,
    price: 850,
    description: 'Corte personalizado con lavado, peinado y asesoría de estilo.',
    category: 'Belleza',
  },
]

const fallbackAppointments: Appointment[] = [
  {
    id: 'apt-demo-1',
    tenantId: getActiveTenantId() || 'tenant-demo',
    customer: {
      id: 'cus-demo-1',
      name: 'María López',
      phone: '+52 55 2345 6120',
      email: 'maria.lopez@email.com',
      avatar: 'ML',
    },
    service: 'Limpieza Dental Premium',
    date: '2026-09-07',
    time: '09:30',
    status: 'confirmed',
    channel: 'WhatsApp',
    notes: ['Confirmó disponibilidad por WhatsApp.'],
    amount: 1200,
  },
]

const defaultBillingPlan: BillingPlan = {
  id: 'plan-pro',
  name: 'Pro',
  monthlyPrice: 59,
  annualPrice: 47,
  description: 'Planeado para equipos con mayor volumen de citas.',
  featured: true,
  features: ['3 sucursales', 'IA multi-canal', 'Google Calendar', 'Reportes avanzados'],
  limits: { conversations: 1000, branches: 3, calendars: 2 },
}

const defaultUsageMetrics: UsageMetric[] = [
  { id: 'conversations', label: 'Conversaciones de IA procesadas', used: 720, limit: 1000, color: 'bg-emerald-500' },
  { id: 'branches', label: 'Sucursales activas', used: 2, limit: 3, color: 'bg-violet-500' },
  { id: 'calendars', label: 'Google Calendars vinculados', used: 2, limit: 2, color: 'bg-amber-500' },
]

const unwrapCollection = <T>(payload: unknown): T => {
  if (Array.isArray(payload)) {
    return payload as T
  }

  if (payload && typeof payload === 'object') {
    const entry = payload as Record<string, unknown>

    if ('data' in entry && entry.data !== undefined) return unwrapCollection<T>(entry.data)
    if ('items' in entry && entry.items !== undefined) return unwrapCollection<T>(entry.items)
    if ('results' in entry && entry.results !== undefined) return unwrapCollection<T>(entry.results)
    if ('payload' in entry && entry.payload !== undefined) return unwrapCollection<T>(entry.payload)
    if ('response' in entry && entry.response !== undefined) return unwrapCollection<T>(entry.response)
    if ('services' in entry && entry.services !== undefined) return unwrapCollection<T>(entry.services)
    if ('appointments' in entry && entry.appointments !== undefined) return unwrapCollection<T>(entry.appointments)
    if ('customers' in entry && entry.customers !== undefined) return unwrapCollection<T>(entry.customers)
    if ('business' in entry && entry.business !== undefined) return unwrapCollection<T>(entry.business)
    if ('tenant' in entry && entry.tenant !== undefined) return unwrapCollection<T>(entry.tenant)
  }

  return payload as T
}

const normalizeCustomer = (item: Record<string, unknown>): Customer => ({
  id: String(item.id ?? item.customer_id ?? item.uuid ?? 'cus-generated'),
  name: String(item.nombre ?? item.name ?? item.cliente ?? 'Cliente nuevo'),
  phone: String(item.phone_number ?? item.phone ?? item.telefono ?? '+52 55 1000 0000'),
  email: String(item.email ?? item.correo ?? 'cliente@agendabot.io'),
  avatar: String(item.avatar ?? String(item.nombre ?? item.name ?? item.cliente ?? 'CN').slice(0, 2).toUpperCase()),
})

const normalizeService = (item: Record<string, unknown>, fallbackId = `svc-${Date.now()}`): Service => ({
  id: String(item.id ?? item.service_id ?? item.uuid ?? fallbackId),
  name: String(item.nombre ?? item.name ?? item.title ?? 'Servicio sin nombre'),
  duration: Number(item.duracion_minutos ?? item.duration ?? item.length_minutes ?? item.duration_minutes ?? 45),
  price: Number(item.precio ?? item.price ?? item.amount ?? item.cost ?? 0),
  description: String(item.descripcion ?? item.description ?? item.notes ?? 'Sin descripción disponible.'),
  category: String(item.categoria ?? item.category ?? item.type ?? 'General'),
  activo: item.activo === undefined ? item.active === undefined ? true : Boolean(item.active) : Boolean(item.activo),
})

const normalizeAppointment = (item: Record<string, unknown>, fallbackId = `apt-${Date.now()}`): Appointment => {
  const rawCustomer = (item.customer ?? item.cliente ?? item.client ?? {}) as Record<string, unknown>
  const rawDate = item.fecha_inicio ?? item.start_at ?? item.date ?? item.start_date ?? '2026-09-10'
  const rawTime = item.start_time ?? item.time ?? item.hora ?? '10:00'
  const rawStatus = String(item.estado ?? item.status ?? 'pending').toLowerCase()

  const parsedDate = new Date(String(rawDate))
  const dateValue = Number.isNaN(parsedDate.getTime()) ? String(rawDate).slice(0, 10) : parsedDate.toISOString().slice(0, 10)
  const timeValue = String(rawTime).slice(0, 5)

  return {
    id: String(item.id ?? item.appointment_id ?? item.uuid ?? fallbackId),
    tenantId: String(item.tenant_id ?? item.tenantId ?? getActiveTenantId()),
    customer: {
      id: String(rawCustomer.id ?? item.customer_id ?? item.customerId ?? `cus-${Date.now()}`),
      name: String(rawCustomer.nombre ?? rawCustomer.name ?? item.cliente ?? item.customer_name ?? 'Cliente nuevo'),
      phone: String(rawCustomer.phone_number ?? rawCustomer.phone ?? item.phone_number ?? item.phone ?? '+52 55 1000 0000'),
      email: String(rawCustomer.email ?? item.email ?? 'cliente@agendabot.io'),
      avatar: String(rawCustomer.avatar ?? String(rawCustomer.nombre ?? rawCustomer.name ?? item.cliente ?? item.customer_name ?? 'CN').slice(0, 2).toUpperCase()),
    },
    service: String(item.servicio ?? item.service_nombre ?? item.service ?? item.name ?? 'Cita agendada'),
    date: dateValue,
    time: timeValue,
    status: rawStatus === 'cancelled' || rawStatus === 'canceled' ? 'cancelled' : rawStatus === 'pending' ? 'pending' : 'confirmed',
    channel: String(item.channel ?? 'WhatsApp') as Appointment['channel'],
    notes: Array.isArray(item.notes) ? item.notes.map((note) => String(note)) : [String(item.notes ?? item.descripcion ?? item.description ?? 'Creada desde integración API.')],
    amount: Number(item.precio ?? item.amount ?? item.price ?? item.total ?? 0),
  }
}

const normalizeTenant = (payload: Record<string, unknown>): Tenant => ({
  id: String(payload.id ?? payload.tenant_id ?? payload.tenantId ?? getActiveTenantId()),
  name: String(payload.nombre ?? payload.name ?? payload.business_name ?? 'Tenant'),
  city: String(payload.city ?? payload.ciudad ?? 'Ciudad de México'),
  speciality: String(payload.speciality ?? payload.segment ?? payload.especialidad ?? 'Atención profesional'),
  address: String(payload.address ?? payload.street_address ?? payload.direccion ?? 'Dirección no disponible'),
  active: Boolean(payload.active ?? true),
  calendarLinked: Boolean(payload.calendar_linked ?? payload.google_calendar_id ?? false),
  role: (String(payload.role ?? payload.rol ?? 'owner') as 'owner' | 'admin' | 'staff'),
})

const normalizeUser = (payload: Record<string, unknown> | null | undefined): UserProfile => ({
  id: typeof payload?.id === 'string' ? payload.id : undefined,
  name: String(payload?.nombre ?? payload?.name ?? 'Usuario'),
  email: String(payload?.email ?? 'usuario@agendabot.io'),
  role: String(payload?.role ?? payload?.rol ?? 'owner'),
})

const normalizeAvailability = (item: Record<string, unknown>, fallbackId = `slot-${Date.now()}`): AvailabilitySlot => ({
  id: String(item.id ?? item.slot_id ?? item.uuid ?? fallbackId),
  day: String(item.day ?? item.date ?? item.label ?? 'Lun'),
  start: String(item.start ?? item.start_time ?? item.start_at ?? '09:00'),
  end: String(item.end ?? item.end_time ?? item.end_at ?? '18:00'),
  available: Boolean(item.available ?? item.enabled ?? true),
})

export const useAppStore = create<AppState>((set, get) => ({
  user: {
    name: 'Alicia Vega',
    email: 'alicia@agendabot.io',
    role: 'Owner / Admin',
  },
  tenants: fallbackTenants,
  customers: fallbackCustomers,
  activeTenantId: getActiveTenantId(),
  isAuthenticated: false,
  isSessionReady: false,
  activeView: 'landing',
  appointments: fallbackAppointments,
  services: fallbackServices,
  selectedAppointmentId: null,
  statusFilter: 'all',
  theme: 'dark',
  activeBillingCycle: 'monthly',
  selectedPlanId: 'pro',
  billingPlan: defaultBillingPlan,
  billingInvoices: [
    { id: 'inv-1', date: '01 Ago 2026', amount: 59, status: 'Pagado', plan: 'Pro' },
    { id: 'inv-2', date: '01 Jul 2026', amount: 59, status: 'Pagado', plan: 'Pro' },
    { id: 'inv-3', date: '01 Jun 2026', amount: 29, status: 'Pagado', plan: 'Starter' },
  ],
  isBillingModalOpen: false,
  quickCreateType: null,
  usageMetrics: defaultUsageMetrics,
  availability: [],
  availabilityMessage: null,
  lastAppointmentError: null,
  analyticsKpis: [
    { id: 'kpi-1', label: 'Citas totales del mes', value: '1,284', delta: '+18.2%', positive: true, accent: 'emerald' },
    { id: 'kpi-2', label: 'Tasa de conversión del bot', value: '34.6%', delta: '+6.4%', positive: true, accent: 'violet' },
    { id: 'kpi-3', label: 'Ingresos estimados', value: '$84.6K', delta: '+12.1%', positive: true, accent: 'emerald' },
    { id: 'kpi-4', label: 'Cancelaciones', value: '42', delta: '-7.8%', positive: false, accent: 'rose' },
  ],
  dailyBookings: [
    { day: 'Lun', bookings: 24 },
    { day: 'Mar', bookings: 38 },
    { day: 'Mié', bookings: 31 },
    { day: 'Jue', bookings: 44 },
    { day: 'Vie', bookings: 52 },
    { day: 'Sáb', bookings: 46 },
    { day: 'Dom', bookings: 28 },
  ],
  hourlyDemand: [
    { hour: '09:00', demand: 12 },
    { hour: '10:00', demand: 24 },
    { hour: '11:00', demand: 28 },
    { hour: '12:00', demand: 18 },
    { hour: '14:00', demand: 31 },
    { hour: '15:00', demand: 30 },
    { hour: '16:00', demand: 22 },
    { hour: '17:00', demand: 16 },
  ],
  serviceMix: [
    { name: 'Belleza', value: 38, color: '#10B981' },
    { name: 'Salud', value: 27, color: '#8B5CF6' },
    { name: 'Estética', value: 22, color: '#F59E0B' },
    { name: 'Spa', value: 13, color: '#F43F5E' },
  ],
  recentActivity: [
    { id: 'act-1', message: 'Bot agendó cita con María López vía WhatsApp hace 3 min', time: 'Hace 3 min', type: 'success' },
    { id: 'act-2', message: 'El servicio de Botox Facial tuvo un 22% más de interés hoy', time: 'Hace 15 min', type: 'ai' },
    { id: 'act-3', message: 'Sofía Ramírez respondió al flujo de confirmación y quedó pendiente', time: 'Hace 34 min', type: 'pending' },
    { id: 'act-4', message: 'Se sincronizó un evento nuevo en Google Calendar', time: 'Hace 1 hr', type: 'sync' },
  ],
  customerDetail: null,
  isHydrated: false,

  setActiveTenant: (tenantId) => {
    set({ activeTenantId: tenantId })
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agendabot_active_tenant_id', tenantId)
    }
  },

  restoreSession: async () => {
    if (typeof window === 'undefined') {
      set({ isSessionReady: true })
      return
    }

    try {
      const token = window.localStorage.getItem('agendabot_token')
      const rawUser = window.localStorage.getItem('agendabot_user')
      const rawTenants = window.localStorage.getItem('agendabot_tenants')
      const rawActiveTenant = window.localStorage.getItem('agendabot_active_tenant_id')

      if (!token || !rawUser || !rawTenants) {
        set({ isAuthenticated: false, isSessionReady: true })
        return
      }

      const base64Payload = token.split('.')[1]
      if (base64Payload) {
        const payload = JSON.parse(atob(base64Payload))
        if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
          window.localStorage.removeItem('agendabot_token')
          window.localStorage.removeItem('agendabot_user')
          window.localStorage.removeItem('agendabot_tenants')
          window.localStorage.removeItem('agendabot_active_tenant_id')
          set({ isAuthenticated: false, isSessionReady: true })
          return
        }
      }

      const user = normalizeUser(JSON.parse(rawUser) as Record<string, unknown>)
      const normalizedTenants = (JSON.parse(rawTenants) as unknown[]).map((tenant) => normalizeTenant((tenant as Record<string, unknown>) ?? {}))
      const fallbackTenantId = normalizedTenants[0]?.id ?? rawActiveTenant ?? getActiveTenantId()

      set({
        user,
        tenants: normalizedTenants.length > 0 ? normalizedTenants : fallbackTenants,
        activeTenantId: rawActiveTenant && normalizedTenants.some((tenant) => tenant.id === rawActiveTenant) ? rawActiveTenant : fallbackTenantId,
        isAuthenticated: true,
        isSessionReady: true,
      })

    } catch (error) {
      console.warn('Session restore failed. Clearing auth state.', error)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('agendabot_token')
        window.localStorage.removeItem('agendabot_user')
        window.localStorage.removeItem('agendabot_tenants')
        window.localStorage.removeItem('agendabot_active_tenant_id')
      }
      set({ isAuthenticated: false, isSessionReady: true })
    }
  },

  login: async (email, password) => {
    const response = await apiRequest<{ token: string; user?: Record<string, unknown>; tenants?: Array<Record<string, unknown>> }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    const token = response.token
    const user = normalizeUser(response.user ?? null)
    const normalizedTenants = Array.isArray(response.tenants) && response.tenants.length > 0
      ? response.tenants.map((tenant) => normalizeTenant(tenant ?? {}))
      : [normalizeTenant({ id: getActiveTenantId() || 'tenant-demo', nombre: 'Negocio principal', role: 'owner' })]

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agendabot_token', token)
      window.localStorage.setItem('agendabot_user', JSON.stringify(user))
      window.localStorage.setItem('agendabot_tenants', JSON.stringify(normalizedTenants))
      window.localStorage.setItem('agendabot_active_tenant_id', normalizedTenants[0].id)
    }

    set({
      user,
      tenants: normalizedTenants,
      activeTenantId: normalizedTenants[0].id,
      isAuthenticated: true,
      isSessionReady: true,
    })

    return normalizedTenants
  },

  register: async (payload) => {
    const response = await apiRequest<{ token: string; user?: Record<string, unknown>; tenant?: Record<string, unknown> }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        nombre_negocio: payload.nombre_negocio,
        nombre_usuario: payload.nombre_usuario,
        timezone: payload.timezone ?? 'America/Mexico_City',
      }),
    })

    const token = response.token
    const user = normalizeUser(response.user ?? null)
    const tenant = normalizeTenant((response.tenant ?? {}) as Record<string, unknown>)
    const normalizedTenants = [tenant]

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agendabot_token', token)
      window.localStorage.setItem('agendabot_user', JSON.stringify(user))
      window.localStorage.setItem('agendabot_tenants', JSON.stringify(normalizedTenants))
      window.localStorage.setItem('agendabot_active_tenant_id', tenant.id)
    }

    set({
      user,
      tenants: normalizedTenants,
      activeTenantId: tenant.id,
      isAuthenticated: true,
      isSessionReady: true,
    })

    return normalizedTenants
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('agendabot_token')
      window.localStorage.removeItem('agendabot_user')
      window.localStorage.removeItem('agendabot_tenants')
      window.localStorage.removeItem('agendabot_active_tenant_id')
    }

    set({
      user: { name: 'Usuario', email: '', role: 'owner' },
      tenants: fallbackTenants,
      activeTenantId: getActiveTenantId() || '',
      isAuthenticated: false,
      isSessionReady: true,
    })
  },

  setActiveView: (view) => {
    set({ activeView: view })
  },

  setTheme: (theme) => {
    set({ theme })
  },

  setSelectedAppointmentId: (appointmentId) => {
    set({ selectedAppointmentId: appointmentId })
  },

  setStatusFilter: (filter) => {
    set({ statusFilter: filter })
  },

  setBillingCycle: (cycle) => {
    set({ activeBillingCycle: cycle })
  },

  setSelectedPlan: (planId) => {
    set({ selectedPlanId: planId })
  },

  setBillingPlan: (planName) => {
    const planConfig: Record<PlanName, BillingPlan> = {
      Starter: { id: 'plan-starter', name: 'Starter', monthlyPrice: 29, annualPrice: 24, description: 'Ideal para negocios en crecimiento.', featured: false, features: ['1 sucursal', 'WhatsApp + IA', 'Calendario básico', 'Recordatorios automáticos'], limits: { conversations: 1000, branches: 1, calendars: 1 } },
      Pro: { id: 'plan-pro', name: 'Pro', monthlyPrice: 59, annualPrice: 47, description: 'Para equipos con mayor volumen de citas.', featured: true, features: ['3 sucursales', 'IA multi-canal', 'Integración Google Calendar', 'Reportes avanzados'], limits: { conversations: 1000, branches: 3, calendars: 2 } },
      Business: { id: 'plan-business', name: 'Business', monthlyPrice: 119, annualPrice: 95, description: 'Para cadenas y franquicias.', featured: false, features: ['Sucursales ilimitadas', 'IA personalizada', 'Soporte prioritario', 'Analytics ejecutivo'], limits: { conversations: 5000, branches: 99, calendars: 5 } },
    }

    const selectedPlan = planConfig[planName]
    set({ billingPlan: selectedPlan, selectedPlanId: selectedPlan.id })

    const usage = get().usageMetrics
    const nextUsage = usage.map((metric) => {
      if (metric.id === 'conversations') {
        return { ...metric, limit: selectedPlan.limits.conversations, used: Math.min(metric.used, selectedPlan.limits.conversations) }
      }
      if (metric.id === 'branches') {
        return { ...metric, limit: selectedPlan.limits.branches, used: Math.min(metric.used, selectedPlan.limits.branches) }
      }
      if (metric.id === 'calendars') {
        return { ...metric, limit: selectedPlan.limits.calendars, used: Math.min(metric.used, selectedPlan.limits.calendars) }
      }
      return metric
    })

    set({ usageMetrics: nextUsage })
  },

  setBillingModalOpen: (open) => {
    set({ isBillingModalOpen: open })
  },

  setQuickCreateType: (type) => {
    set({ quickCreateType: type })
  },

  updateUsageMetric: (id, used, limit) => {
    set((state) => ({
      usageMetrics: state.usageMetrics.map((metric) => (metric.id === id ? { ...metric, used, limit } : metric)),
    }))
  },

  hydrateFromApi: async () => {
    try {
      const tenantId = getActiveTenantId()
      const [servicesResponse, appointmentsResponse, businessResponse, customersResponse] = await Promise.all([
        apiRequest<unknown>('/api/services', { method: 'GET' }, { tenant_id: tenantId }),
        apiRequest<unknown>('/api/appointments', { method: 'GET' }, { tenant_id: tenantId }),
        apiRequest<unknown>('/api/business', { method: 'GET' }, { tenant_id: tenantId }),
        apiRequest<unknown>('/api/customers', { method: 'GET' }, { tenant_id: tenantId }),
      ])

      const services = unwrapCollection<Service[]>(servicesResponse)
      const appointments = unwrapCollection<unknown[]>(appointmentsResponse)
      const business = unwrapCollection<Record<string, unknown>>(businessResponse)
      const customers = unwrapCollection<unknown[]>(customersResponse)

      set({
        services: Array.isArray(services) && services.length > 0 ? services.map((item, index) => normalizeService((item as unknown as Record<string, unknown>) ?? {}, `svc-${index + 1}`)) : fallbackServices,
        appointments: Array.isArray(appointments) && appointments.length > 0 ? appointments.map((item, index) => normalizeAppointment((item as unknown as Record<string, unknown>) ?? {}, `apt-${index + 1}`)) : fallbackAppointments,
        customers: Array.isArray(customers) && customers.length > 0 ? customers.map((item) => normalizeCustomer((item as unknown as Record<string, unknown>) ?? {})) : fallbackCustomers,
        isHydrated: true,
      })

      if (business && typeof business === 'object') {
        const normalizedBusiness = normalizeTenant(business as Record<string, unknown>)
        set({
          tenants: [normalizedBusiness],
          activeTenantId: normalizedBusiness.id,
        })
      }
    } catch (error) {
      console.warn('API hydration failed; using demo fallback data.', error)
      set({ isHydrated: true })
    }
  },

  loadCustomers: async () => {
    try {
      const tenantId = getActiveTenantId()
      const response = await apiRequest<unknown>('/api/customers', { method: 'GET' }, { tenant_id: tenantId })
      const customers = unwrapCollection<unknown[]>(response)
      set({
        customers: Array.isArray(customers) && customers.length > 0 ? customers.map((item) => normalizeCustomer((item as unknown as Record<string, unknown>) ?? {})) : fallbackCustomers,
      })
    } catch (error) {
      console.warn('Customers could not be loaded from the backend.', error)
    }
  },

  loadCustomerDetail: async (customerId) => {
    try {
      const tenantId = getActiveTenantId()
      const response = await apiRequest<unknown>('/api/customers', { method: 'GET' }, { tenant_id: tenantId, customer_id: customerId })
      // No usar unwrapCollection aquí: este endpoint siempre responde un objeto plano
      // { id, nombre, phone_number, email, appointments }, nunca envuelto en data/items/etc.
      // unwrapCollection tiene una regla genérica que desenvuelve cualquier objeto con una
      // llave "appointments" (pensada para /api/appointments) — aplicada aquí, se comía el
      // cliente entero y dejaba solo el arreglo de citas, perdiendo id/nombre/telefono/email.
      const source = (response && typeof response === 'object' && !Array.isArray(response))
        ? (response as Record<string, unknown>)
        : {}
      const safeList = Array.isArray(source.appointments)
        ? source.appointments
        : Array.isArray((source as Record<string, unknown>).items)
          ? (source as Record<string, unknown>).items as unknown[]
          : []

      const safeEmail = typeof source.email === 'string'
        ? source.email
        : typeof source.correo === 'string'
          ? source.correo
          : null

      set({
        customerDetail: {
          id: String(source.id ?? source.customer_id ?? customerId),
          name: String(source.nombre ?? source.name ?? source.cliente ?? 'Cliente'),
          phone: String(source.phone_number ?? source.phone ?? source.telefono ?? '+52 55 1000 0000'),
          email: safeEmail,
          appointments: safeList.map((appointment) => {
            const item = appointment as Record<string, unknown>
            const rawStatus = String(item.estado ?? item.status ?? 'pending').toLowerCase()
            return {
              id: String(item.id ?? item.appointment_id ?? 'apt-local'),
              date: String(item.fecha_inicio ?? item.date ?? item.start_at ?? '2026-09-10').slice(0, 10),
              status: rawStatus === 'cancelled' || rawStatus === 'canceled' ? 'cancelled' : rawStatus === 'confirmed' ? 'confirmed' : 'pending',
              amount: Number(item.precio ?? item.amount ?? item.price ?? 0),
              service: String(item.servicio ?? item.service ?? item.service_nombre ?? 'Servicio'),
            }
          }),
        },
      })
    } catch (error) {
      console.warn('Customer detail could not be loaded from the backend.', error)
      set({ customerDetail: null })
    }
  },

  loadAnalytics: async (range = '30d') => {
    try {
      const tenantId = getActiveTenantId()
      const response = await apiRequest<unknown>('/api/analytics/summary', { method: 'GET' }, { tenant_id: tenantId, range })
      const payload = unwrapCollection<Record<string, unknown>>(response)
      const source = payload && typeof payload === 'object' ? payload : {}
      const kpis = (source.kpis ?? source.metrics ?? {}) as Record<string, unknown>
      const rawBookings = Array.isArray(source.bookings_by_day) ? source.bookings_by_day : Array.isArray(source.days) ? source.days : []
      const rawHourly = Array.isArray(source.hourly_demand) ? source.hourly_demand : Array.isArray(source.horarios) ? source.horarios : []
      const rawMix = Array.isArray(source.service_mix) ? source.service_mix : Array.isArray(source.servicios) ? source.servicios : []
      const palette = ['#10B981', '#8B5CF6', '#F59E0B', '#F43F5E', '#38BDF8']

      const readScalar = (obj: Record<string, unknown>, aliases: string[]): number | string | null => {
        for (const alias of aliases) {
          const raw = obj[alias]
          if (raw === undefined || raw === null || raw === '') continue

          if (typeof raw === 'object') {
            const nested = raw as Record<string, unknown>
            const nestedValue = nested.value ?? nested.amount ?? nested.total ?? nested.count ?? nested.current ?? nested.value_numeric ?? nested.metric
            if (typeof nestedValue === 'number' || typeof nestedValue === 'string') {
              return nestedValue
            }
            const direct = Object.values(nested).find((value) => typeof value === 'number' || typeof value === 'string')
            if (typeof direct === 'number' || typeof direct === 'string') return direct
          }

          if (typeof raw === 'number' || typeof raw === 'string') {
            return raw
          }
        }

        return null
      }

      const readDelta = (obj: Record<string, unknown>, aliases: string[]): number => {
        for (const alias of aliases) {
          const raw = obj[alias]
          if (raw === undefined || raw === null || raw === '') continue

          if (typeof raw === 'object') {
            const nested = raw as Record<string, unknown>
            const pot = nested.delta ?? nested.change ?? nested.percent_change ?? nested.variance ?? nested.growth ?? nested.trend ?? nested.difference ?? nested.percent
            if (typeof pot === 'number' || typeof pot === 'string') {
              const parsed = Number(String(pot).replace(/%/g, '').replace(/,/g, '').trim())
              if (!Number.isNaN(parsed)) return parsed
            }
          }

          const parsed = Number(String(raw).replace(/%/g, '').replace(/,/g, '').trim())
          if (!Number.isNaN(parsed)) return parsed
        }

        return 0
      }

      const formatSignedPercent = (value: number) => {
        if (!Number.isFinite(value)) return '0%'
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
      }

      const normalizeMetric = (aliases: string[], label: string, formatter: (raw: number | string | null) => string, accent: 'emerald' | 'violet' | 'amber' | 'rose', fallbackValue: string) => {
        const rawValue = readScalar(kpis, aliases)
        const value = formatter(rawValue ?? fallbackValue)
        const deltaRaw = readDelta(kpis, aliases.flatMap((alias) => [`${alias}_delta`, `${alias}_change`, `${alias}_percent_change`, `${alias}_trend`, `delta_${alias}`, `change_${alias}`]))
        const positive = deltaRaw >= 0

        return {
          id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-kpi`,
          label,
          value,
          delta: formatSignedPercent(deltaRaw),
          positive,
          accent,
        }
      }

      const currencyValue = (raw: number | string | null) => {
        const numeric = typeof raw === 'number' ? raw : Number(String(raw ?? '0').replace(/[$,\s]/g, ''))
        if (!Number.isFinite(numeric)) return '$0'
        return `$${numeric.toLocaleString()}`
      }

      const percentValue = (raw: number | string | null) => {
        const numeric = typeof raw === 'number' ? raw : Number(String(raw ?? '0').replace(/%/g, '').replace(/,/g, ''))
        if (!Number.isFinite(numeric)) return '0%'
        return `${numeric}%`
      }

      const baseKpis = [
        normalizeMetric(['total_citas', 'total_bookings', 'appointments_total', 'total_appointments', 'total'], 'Citas totales del mes', (raw) => String(raw ?? '0'), 'emerald', '0'),
        normalizeMetric(['tasa_conversion_bot', 'conversion_rate', 'bot_conversion', 'conversion', 'conversion_rate_bot'], 'Tasa de conversión del bot', percentValue, 'violet', '0%'),
        normalizeMetric(['ingresos_estimados', 'estimated_revenue', 'revenue', 'ingresos'], 'Ingresos estimados', currencyValue, 'emerald', '$0'),
        normalizeMetric(['cancelaciones', 'cancellations', 'cancelled', 'cancellation_rate'], 'Cancelaciones', (raw) => String(raw ?? '0'), 'rose', '0'),
      ]

      set({
        analyticsKpis: baseKpis.map((item) => ({
          ...item,
          value: item.id.includes('cancelaciones') && !String(item.value).includes('%') ? String(item.value) : item.value,
        })),
        dailyBookings: rawBookings.map((entry) => ({ day: String((entry as Record<string, unknown>).day ?? (entry as Record<string, unknown>).dia ?? 'Día'), bookings: Number((entry as Record<string, unknown>).bookings ?? (entry as Record<string, unknown>).citas ?? 0) })),
        hourlyDemand: rawHourly.map((entry) => ({ hour: String((entry as Record<string, unknown>).hour ?? (entry as Record<string, unknown>).hora ?? '00:00'), demand: Number((entry as Record<string, unknown>).demand ?? (entry as Record<string, unknown>).cantidad ?? 0) })),
        serviceMix: rawMix.map((entry, index) => ({ name: String((entry as Record<string, unknown>).name ?? (entry as Record<string, unknown>).nombre ?? 'Servicio'), value: Number((entry as Record<string, unknown>).value ?? (entry as Record<string, unknown>).porcentaje ?? 0), color: palette[index % palette.length] })),
      })
    } catch (error) {
      console.warn('Analytics could not be loaded from the backend.', error)
    }
  },

  loadRecentActivity: async (limit = 10) => {
    try {
      const tenantId = getActiveTenantId()
      const response = await apiRequest<unknown>('/api/activity/recent', { method: 'GET' }, { tenant_id: tenantId, limit: String(limit) })
      const payload = unwrapCollection<unknown[]>(response)
      const activity = Array.isArray(payload) ? payload : []

      set({
        recentActivity: activity.map((item) => {
          const entry = item as Record<string, unknown>
          const status = String(entry.estado ?? entry.status ?? 'success')
          const type = status === 'cancelled' ? 'pending' : status === 'confirmed' ? 'success' : 'ai'
          return {
            id: String(entry.id ?? entry.activity_id ?? 'activity-id'),
            message: `${String(entry.cliente ?? entry.customer ?? entry.name ?? 'Cliente')} ${status === 'cancelled' ? 'canceló' : 'agendó'} ${String(entry.servicio ?? entry.service ?? entry.nombre_servicio ?? 'servicio')} ${String(entry.fecha_inicio ?? entry.date ?? entry.fecha ?? '').slice(0, 10)}`,
            time: String(entry.updated_at || entry.updatedAt || entry.created_at || 'Hace un momento').includes('T')
              ? new Date(String(entry.updated_at || entry.updatedAt || entry.created_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : String(entry.updated_at || entry.updatedAt || entry.created_at || 'Hace un momento'),
            type: type as 'success' | 'ai' | 'pending' | 'sync',
          }
        }),
      })
    } catch (error) {
      console.warn('Recent activity could not be loaded from the backend.', error)
    }
  },

  loadAvailability: async (serviceId: string, date: string) => {
    try {
      const tenantId = getActiveTenantId()
      const response = await apiRequest<Record<string, unknown>>('/api/availability', { method: 'GET' }, { tenant_id: tenantId, service_id: serviceId, date })
      const rawSlots = Array.isArray(response?.slots) ? response.slots : Array.isArray(response?.items) ? response.items : []
      const available = typeof response?.available === 'boolean' ? response.available : rawSlots.length > 0
      const reason = typeof response?.reason === 'string' ? response.reason : null
      const message = available ? null : reason === 'DAY_CLOSED' ? 'El negocio no atiende ese día' : reason === 'NO_SLOTS_AVAILABLE' ? 'No hay horarios libres ese día' : reason === 'CALENDAR_NOT_CONNECTED' ? 'Este negocio no tiene Google Calendar conectado' : reason === 'SERVICE_NOT_FOUND' ? 'Este servicio no está disponible para esta sucursal' : 'No hay disponibilidad para esta fecha'

      set({
        availability: rawSlots.map((item, index) => normalizeAvailability((item as unknown as Record<string, unknown>) ?? {}, `slot-${index + 1}`)),
        availabilityMessage: message,
      })
    } catch (error) {
      console.warn('Availability could not be loaded from the backend.', error)
      set({ availability: [], availabilityMessage: 'No pudimos cargar la disponibilidad. Intenta otra fecha.' })
    }
  },

  setLastAppointmentError: (message) => {
    set({ lastAppointmentError: message })
  },

  setAvailabilityMessage: (message) => {
    set({ availabilityMessage: message })
  },

  addCustomer: async (data) => {
    try {
      const tenantId = getActiveTenantId()
      const payload = {
        tenant_id: tenantId,
        nombre: data.nombre.trim(),
        phone_number: data.phoneNumber.trim(),
        email: data.email?.trim() || undefined,
      }

      const response = await apiRequest<Record<string, unknown>>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, { tenant_id: tenantId })

      const created = normalizeCustomer((response as Record<string, unknown>) ?? ({ ...payload } as Record<string, unknown>))

      set((state) => ({
        customers: [created, ...state.customers.filter((customer) => customer.id !== created.id && customer.phone !== created.phone)],
      }))

      return created
    } catch (error) {
      console.warn('Customer could not be created from the backend.', error)
      const localCustomer: Customer = {
        id: `cus-local-${Date.now()}`,
        name: data.nombre.trim(),
        phone: data.phoneNumber.trim(),
        email: data.email?.trim() || 'cliente@agendabot.io',
        avatar: data.nombre.trim().slice(0, 2).toUpperCase() || 'CN',
      }

      set((state) => ({
        customers: [localCustomer, ...state.customers.filter((customer) => customer.phone !== localCustomer.phone)],
      }))

      return localCustomer
    }
  },

  updateBusiness: async (business) => {
    try {
      const tenantId = getActiveTenantId()
      const payload = {
        id: business.id ?? tenantId,
        nombre: business.nombre ?? business.name,
        timezone: business.timezone,
        horario_atencion: business.horario_atencion,
        google_calendar_id: business.google_calendar_id,
        prompt_custom_ia: business.prompt_custom_ia,
      }

      const response = await apiRequest<Record<string, unknown>>('/api/business', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }, { tenant_id: tenantId })

      const normalized = normalizeTenant(response ?? ({ ...payload, tenant_id: tenantId } as Record<string, unknown>))
      set((state) => ({
        tenants: [normalized, ...state.tenants.filter((tenant) => tenant.id !== normalized.id)],
        activeTenantId: normalized.id,
      }))
    } catch (error) {
      console.warn('Business configuration could not be updated.', error)
    }
  },

  forgotPassword: async (email) => {
    const response = await forgotPassword({ email })
    return response.message
  },

  resetPassword: async ({ token, new_password }) => {
    const response = await resetPassword({ token, new_password })
    return response.message
  },

  changePassword: async ({ current_password, new_password }) => {
    const response = await changePassword({ current_password, new_password })
    return response.message
  },

  listTeamMembers: async (tenantId) => {
    const response = await listTeamMembers(tenantId)
    return Array.isArray(response.members) ? response.members : []
  },

  updateTeamMemberRole: async ({ tenant_id, user_id, role }) => {
    const response = await updateTeamMemberRole({ tenant_id, user_id, role })
    return { user_id: response.user_id, role: response.role }
  },

  removeTeamMember: async ({ tenant_id, user_id }) => {
    const response = await removeTeamMember({ tenant_id, user_id })
    return response.message
  },

  inviteTeamMember: async ({ nombre, email, password, role }) => {
    const tenantId = getActiveTenantId()
    const response = await apiRequest<{ created: boolean; user?: Record<string, unknown>; role?: 'admin' | 'staff'; password?: string }>('/api/team/invite', {
      method: 'POST',
      body: JSON.stringify({
        tenant_id: tenantId,
        nombre,
        email,
        password,
        role,
      }),
    }, { tenant_id: tenantId })

    const createdUser = response.user ?? { id: 'team-user', email, nombre }
    const responseRole = response.role ?? role
    const resolvedPassword = response.password ?? password

    return {
      created: Boolean(response.created),
      user: {
        id: String(createdUser.id ?? 'team-user'),
        email: String(createdUser.email ?? email),
        nombre: String(createdUser.nombre ?? nombre),
      },
      role: responseRole,
      password: resolvedPassword,
    }
  },

  updateService: async (serviceId, patch) => {
    try {
      const tenantId = getActiveTenantId()
      const currentService = get().services.find((service) => service.id === serviceId)
      const payload: Record<string, unknown> = {
        id: serviceId,
        tenant_id: tenantId,
      }

      if (patch.name !== undefined) payload.nombre = patch.name
      if (patch.description !== undefined) payload.descripcion = patch.description
      if (patch.price !== undefined) payload.precio = patch.price
      if (patch.duration !== undefined) payload.duracion_minutos = patch.duration
      if (patch.activo !== undefined) payload.activo = patch.activo

      const response = await apiRequest<Record<string, unknown>>('/api/services', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }, { tenant_id: tenantId })

      const updated = normalizeService(response ?? { ...currentService, ...patch } as Record<string, unknown>, serviceId)
      set((state) => ({
        services: state.services.map((service) => (service.id === serviceId ? updated : service)),
      }))
    } catch (error) {
      console.warn('The service could not be updated in the backend.', error)
    }
  },

  cancelAppointment: async (appointmentId) => {
    try {
      const tenantId = getActiveTenantId()
      const response = await apiRequest<Record<string, unknown>>('/api/appointments', {
        method: 'PATCH',
        body: JSON.stringify({
          id: appointmentId,
          tenant_id: tenantId,
          estado: 'cancelled',
        }),
      }, { tenant_id: tenantId })

      if (response && response.cancelled === true) {
        set((state) => ({
          appointments: state.appointments.map((appointment) => appointment.id === appointmentId ? { ...appointment, status: 'cancelled' } : appointment),
        }))
      }
    } catch (error) {
      console.warn('The appointment could not be cancelled in the backend.', error)
    }
  },

  addService: async (service) => {
    try {
      const tenantId = getActiveTenantId()
      const normalized = await apiRequest<Record<string, unknown>>('/api/services', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          nombre: service.name,
          descripcion: service.description,
          precio: service.price,
          duracion_minutos: service.duration,
        }),
      }, { tenant_id: tenantId })

      const created = normalizeService(normalized ?? { ...service } as Record<string, unknown>, service.id)

      set((state) => ({
        services: [created, ...state.services.filter((item) => item.id !== created.id)],
      }))
    } catch (error) {
      console.warn('The service could not be synced with the backend. Falling back to local state.', error)
      set((state) => ({ services: [service, ...state.services] }))
    }
  },

  addAppointment: async (appointment) => {
    try {
      if (!appointment.customerId || !appointment.serviceId) {
        throw new Error('Customer and service ids are required.')
      }

      const tenantId = getActiveTenantId()
      const response = await apiRequest<Record<string, unknown>>('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          customer_id: appointment.customerId,
          service_id: appointment.serviceId,
          date: appointment.date,
          start_time: appointment.time,
        }),
      }, { tenant_id: tenantId })

      if (response && typeof response === 'object' && 'created' in response && response.created === false) {
        const reason = String(response.reason ?? 'BOOKING_FAILED_RETRY')
        const message = reason === 'DAY_CLOSED'
          ? 'El negocio no atiende ese día'
          : reason === 'NO_SLOTS_AVAILABLE'
            ? 'No hay horarios libres ese día'
            : reason === 'CALENDAR_NOT_CONNECTED'
              ? 'Este negocio no tiene Google Calendar conectado'
              : reason === 'CALENDAR_ERROR' || reason === 'BOOKING_FAILED_RETRY'
                ? 'Ocurrió un error, intenta de nuevo'
                : 'No pudimos agendar la cita'

        set({ lastAppointmentError: message })
        throw new Error(message)
      }

      set({ lastAppointmentError: null })

      const created = normalizeAppointment({
        id: response?.appointment_id ?? appointment.id ?? `apt-${Date.now()}`,
        tenant_id: tenantId,
        cliente: appointment.customer?.name ?? get().customers.find((customer) => customer.id === appointment.customerId)?.name ?? 'Cliente',
        servicio: appointment.service ?? get().services.find((service) => service.id === appointment.serviceId)?.name ?? 'Servicio',
        fecha_inicio: `${appointment.date}T${appointment.time}:00`,
        estado: appointment.status ?? 'pending',
        precio: appointment.amount ?? 0,
        channel: appointment.channel ?? 'WhatsApp',
        notes: appointment.notes ?? ['Creada desde el panel'],
      }, `apt-${Date.now()}`)

      set((state) => ({
        appointments: [created, ...state.appointments.filter((item) => item.id !== created.id)],
      }))
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Sin conexión. Intenta de nuevo.'
      set({ lastAppointmentError: message })
      console.warn('The appointment could not be synced with the backend.', error)
    }
  },

  addTenant: (tenant) => {
    const current = get().tenants
    set({ tenants: [tenant, ...current] })
  },
}))

export { API_BASE_URL }
