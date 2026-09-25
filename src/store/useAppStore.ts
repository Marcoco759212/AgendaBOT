import { create } from 'zustand'
import {
  changePassword as changePasswordApi,
  forgotPassword as forgotPasswordApi,
  login as loginApi,
  register as registerApi,
  resetPassword as resetPasswordApi,
} from '../api/auth.api'
import {
  getBusiness,
  updateBusiness as updateBusinessApi,
} from '../api/business.api'
import { getSummary, getRecentActivity as getRecentActivityApi } from '../api/analytics.api'
import { getAppointments, updateAppointment as updateAppointmentApi, createAppointment as createAppointmentApi } from '../api/appointments.api'
import { getCustomers, createCustomer as createCustomerApi } from '../api/customers.api'
import { getAvailability } from '../api/availability.api'
import { getServices, createService as createServiceApi, updateService as updateServiceApi } from '../api/services.api'
import { getTeam, inviteMember } from '../api/team.api'
import { API_BASE_URL, apiRequest } from '../lib/api'
import type { Appointment, AppointmentStatus, AvailabilitySlot, BillingCycle, BillingInvoice, BillingPlan, Customer, CustomerDetail, PlanName, RecentActivityItem, Service, Tenant, ViewName } from '../types'

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
  dashboardError: string | null

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
  setDashboardError: (message: string | null) => void
  addCustomer: (data: { nombre: string; phoneNumber: string; email?: string }) => Promise<Customer>
  updateBusiness: (business: Partial<Tenant> & { nombre?: string; timezone?: string; horario_atencion?: Record<string, unknown>; prompt_custom_ia?: string; google_calendar_id?: string; direccion?: string; referencias_direccion?: string }) => Promise<void>
  forgotPassword: (email: string) => Promise<string>
  resetPassword: (payload: { token: string; new_password: string }) => Promise<string>
  changePassword: (payload: { current_password: string; new_password: string }) => Promise<string>
  listTeamMembers: (tenantId: string) => Promise<Array<{ id: string; email: string; nombre: string; role: 'owner' | 'admin' | 'staff' }>>
  updateTeamMemberRole: (payload: { tenant_id: string; user_id: string; role: 'admin' | 'staff' }) => Promise<{ user_id: string; role: 'admin' | 'staff' }>
  removeTeamMember: (payload: { tenant_id: string; user_id: string }) => Promise<string>
  inviteTeamMember: (member: { nombre: string; email: string; password: string; role: 'admin' | 'staff' }) => Promise<{ created: boolean; user: { id: string; email: string; nombre: string }; role: 'admin' | 'staff'; password: string }>
  updateService: (serviceId: string, patch: ServicePatch) => Promise<void>
  cancelAppointment: (appointmentId: string) => Promise<void>
  editAppointment: (appointmentId: string, patch: { date?: string; time?: string; serviceId?: string; amount?: number }) => Promise<void>
  addService: (service: Service) => Promise<void>
  addAppointment: (appointment: AppointmentInput) => Promise<void>
  addTenantFromServer: (tenant: Partial<Tenant> | Record<string, unknown>) => void
  clearTenantSetupFlag: (tenantId: string) => void
}

const getActiveTenantId = () => {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('agendabot_active_tenant_id') ?? ''
}

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
    if ('members' in entry && entry.members !== undefined) return unwrapCollection<T>(entry.members)
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

const normalizeAppointmentStatus = (raw: unknown): AppointmentStatus => {
  const value = String(raw ?? '').toLowerCase()

  if (value === 'confirmed' || value === 'confirmada' || value === 'confirmado') return 'confirmed'
  if (value === 'cancelled' || value === 'canceled' || value === 'cancelada' || value === 'cancelado') return 'cancelled'

  return 'pending'
}

const normalizeAppointment = (item: Record<string, unknown>, fallbackId = `apt-${Date.now()}`): Appointment => {
  const rawCustomer = (item.customer ?? item.cliente ?? item.client ?? {}) as Record<string, unknown>
  const rawDate = item.fecha_inicio ?? item.start_at ?? item.date ?? item.start_date ?? '2026-09-10'
  const rawTime = item.start_time ?? item.time ?? item.hora ?? '10:00'

  const parsedDate = new Date(String(rawDate))
  const dateValue = Number.isNaN(parsedDate.getTime()) ? String(rawDate).slice(0, 10) : parsedDate.toISOString().slice(0, 10)
  const timeValue = String(rawTime).slice(0, 5)

  return {
    id: String(item.id ?? item.appointment_id ?? item.uuid ?? fallbackId),
    tenantId: String(item.tenant_id ?? item.tenantId ?? getActiveTenantId()),
    serviceId: item.service_id !== undefined && item.service_id !== null ? String(item.service_id) : undefined,
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
    status: normalizeAppointmentStatus(item.estado ?? item.status),
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
  address: String(payload.address ?? payload.street_address ?? payload.direccion ?? ''),
  locationReference: String(payload.locationReference ?? payload.referencias_direccion ?? ''),
  timezone: String(payload.timezone ?? 'America/Mexico_City'),
  promptCustomIa: String(payload.promptCustomIa ?? payload.prompt_custom_ia ?? ''),
  horarioAtencion: (payload.horarioAtencion ?? payload.horario_atencion ?? null) as Tenant['horarioAtencion'],
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
    name: 'Usuario',
    email: '',
    role: 'owner',
  },
  tenants: [],
  customers: [],
  activeTenantId: getActiveTenantId() ?? '',
  isAuthenticated: false,
  isSessionReady: false,
  activeView: 'landing',
  appointments: [],
  services: [],
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
  analyticsKpis: [],
  dailyBookings: [],
  hourlyDemand: [],
  serviceMix: [],
  recentActivity: [],
  customerDetail: null,
  isHydrated: false,
  dashboardError: null,

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
        set({ isAuthenticated: false, isSessionReady: true, tenants: [], activeTenantId: '', customers: [], services: [], appointments: [] })
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
      const nextTenantId = rawActiveTenant && normalizedTenants.some((tenant) => tenant.id === rawActiveTenant) ? rawActiveTenant : normalizedTenants[0]?.id ?? ''

      // Importante: getActiveTenantId() (usado por hydrateFromApi, loadCustomers, etc.) lee
      // directo de localStorage, no del estado de Zustand. Si rawActiveTenant estaba vacio o
      // ya no correspondia a ningun tenant, hay que persistir el fallback aqui tambien; si no,
      // el estado en memoria queda correcto pero localStorage se queda con el valor viejo/invalido
      // y las siguientes llamadas al backend mandan un tenant_id que no existe (0 filas -> respuesta
      // vacia -> "Unexpected end of JSON input" al hacer response.json()).
      if (nextTenantId) {
        window.localStorage.setItem('agendabot_active_tenant_id', nextTenantId)
      } else {
        window.localStorage.removeItem('agendabot_active_tenant_id')
      }

      set({
        user,
        tenants: normalizedTenants,
        activeTenantId: nextTenantId,
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
    const response = await loginApi(email, password)

    const token = response.token
    const user = normalizeUser(response.user ?? null)
    const normalizedTenants = Array.isArray(response.tenants) && response.tenants.length > 0
      ? response.tenants.map((tenant) => normalizeTenant(tenant ?? {}))
      : [normalizeTenant({ id: getActiveTenantId() || 'tenant-demo', nombre: 'Negocio principal', role: 'owner' })]

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agendabot_token', token)
      window.localStorage.setItem('agendabot_user', JSON.stringify(user))
      window.localStorage.setItem('agendabot_tenants', JSON.stringify(normalizedTenants))
      if (normalizedTenants[0]) {
        window.localStorage.setItem('agendabot_active_tenant_id', normalizedTenants[0].id)
      } else {
        window.localStorage.removeItem('agendabot_active_tenant_id')
      }
    }

    set({
      user,
      tenants: normalizedTenants,
      activeTenantId: normalizedTenants[0]?.id ?? '',
      isAuthenticated: true,
      isSessionReady: true,
    })

    return normalizedTenants
  },

  register: async (payload) => {
    const response = await registerApi({
      email: payload.email,
      password: payload.password,
      nombre_negocio: payload.nombre_negocio,
      nombre_usuario: payload.nombre_usuario,
      timezone: payload.timezone ?? 'America/Mexico_City',
    })

    const token = response.token
    const user = normalizeUser(response.user ?? null)
    const tenant = normalizeTenant((response.tenant ?? {}) as Record<string, unknown>)
    const normalizedTenants = [tenant]

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agendabot_token', token)
      window.localStorage.setItem('agendabot_user', JSON.stringify(user))
      window.localStorage.setItem('agendabot_tenants', JSON.stringify(normalizedTenants))
      if (tenant.id) {
        window.localStorage.setItem('agendabot_active_tenant_id', tenant.id)
      }
    }

    set({
      user,
      tenants: normalizedTenants,
      activeTenantId: tenant.id ?? '',
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
      tenants: [],
      activeTenantId: '',
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
        getServices(tenantId),
        getAppointments(tenantId),
        getBusiness(tenantId),
        getCustomers(tenantId),
      ])

      const services = unwrapCollection<Service[]>(servicesResponse)
      const appointments = unwrapCollection<unknown[]>(appointmentsResponse)
      const business = unwrapCollection<Record<string, unknown>>(businessResponse)
      const customers = unwrapCollection<unknown[]>(customersResponse)

      set({
        services: Array.isArray(services) ? services.map((item, index) => normalizeService((item as unknown as Record<string, unknown>) ?? {}, `svc-${index + 1}`)) : [],
        appointments: Array.isArray(appointments) ? appointments.map((item, index) => normalizeAppointment((item as unknown as Record<string, unknown>) ?? {}, `apt-${index + 1}`)) : [],
        customers: Array.isArray(customers) ? customers.map((item) => normalizeCustomer((item as unknown as Record<string, unknown>) ?? {})) : [],
        // Se limpia el detalle de cliente seleccionado: ahora que este metodo tambien corre al
        // cambiar de negocio (no solo al montar), si habia un cliente abierto de otro tenant
        // se quedaba mostrado hasta que el usuario eligiera uno nuevo manualmente.
        customerDetail: null,
        isHydrated: true,
        dashboardError: null,
      })

      if (business && typeof business === 'object') {
        const normalizedBusiness = normalizeTenant(business as Record<string, unknown>)
        set((state) => {
          const exists = state.tenants.some((tenant) => tenant.id === normalizedBusiness.id)
          const nextTenants = exists
            ? state.tenants.map((tenant) => (tenant.id === normalizedBusiness.id ? { ...tenant, ...normalizedBusiness } : tenant))
            : [normalizedBusiness, ...state.tenants]

          if (typeof window !== 'undefined') {
            window.localStorage.setItem('agendabot_tenants', JSON.stringify(nextTenants))
          }

          return { tenants: nextTenants }
        })
      }
    } catch (error) {
      console.warn('API hydration failed; the store remains empty until the backend is available.', error)
      set({ services: [], appointments: [], customers: [], isHydrated: true, dashboardError: 'No pudimos cargar la informacion de tu negocio. Verifica tu conexion e intenta de nuevo.' })
    }
  },

  loadCustomers: async () => {
    try {
      const tenantId = getActiveTenantId()
      const response = await getCustomers(tenantId)
      const customers = unwrapCollection<unknown[]>(response)
      set({
        customers: Array.isArray(customers) ? customers.map((item) => normalizeCustomer((item as unknown as Record<string, unknown>) ?? {})) : [],
        dashboardError: null,
      })
    } catch (error) {
      console.warn('Customers could not be loaded from the backend.', error)
      set({ customers: [], dashboardError: 'No pudimos cargar la lista de clientes.' })
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
            return {
              id: String(item.id ?? item.appointment_id ?? 'apt-local'),
              date: String(item.fecha_inicio ?? item.date ?? item.start_at ?? '2026-09-10').slice(0, 10),
              status: normalizeAppointmentStatus(item.estado ?? item.status),
              amount: Number(item.precio ?? item.amount ?? item.price ?? 0),
              service: String(item.servicio ?? item.service ?? item.service_nombre ?? 'Servicio'),
            }
          }),
        },
        dashboardError: null,
      })
    } catch (error) {
      console.warn('Customer detail could not be loaded from the backend.', error)
      set({ customerDetail: null, dashboardError: 'No pudimos cargar el detalle del cliente.' })
    }
  },

  loadAnalytics: async (range = '30d') => {
    try {
      const tenantId = getActiveTenantId()
      const response = await getSummary(tenantId, range)
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
        dashboardError: null,
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
      set({ dashboardError: 'No pudimos cargar las metricas del dashboard.' })
    }
  },

  loadRecentActivity: async (limit = 10) => {
    try {
      const tenantId = getActiveTenantId()
      const response = await getRecentActivityApi(tenantId, limit)
      const payload = unwrapCollection<unknown[]>(response)
      const activity = Array.isArray(payload) ? payload : []

      set({
        dashboardError: null,
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
      set({ dashboardError: 'No pudimos cargar la actividad reciente.' })
    }
  },

  loadAvailability: async (_serviceId: string, _date: string) => {
    try {
      const tenantId = getActiveTenantId()
      const response = await getAvailability(tenantId)
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

  setDashboardError: (message) => {
    set({ dashboardError: message })
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

      const response = await createCustomerApi(tenantId, payload)

      const created = normalizeCustomer((response as Record<string, unknown>) ?? ({ ...payload } as Record<string, unknown>))

      set((state) => ({
        customers: [created, ...state.customers.filter((customer) => customer.id !== created.id && customer.phone !== created.phone)],
      }))

      return created
    } catch (error) {
      console.warn('Customer could not be created from the backend.', error)
      throw error instanceof Error ? error : new Error('No pudimos guardar el cliente.')
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
        direccion: business.direccion ?? business.address,
        referencias_direccion: business.referencias_direccion ?? business.locationReference,
      }

      const response = await updateBusinessApi(tenantId, payload)

      const normalized = normalizeTenant(response ?? ({ ...payload, tenant_id: tenantId } as Record<string, unknown>))
      set((state) => ({
        tenants: [normalized, ...state.tenants.filter((tenant) => tenant.id !== normalized.id)],
        activeTenantId: normalized.id,
      }))
    } catch (error) {
      console.warn('Business configuration could not be updated.', error)
      throw error instanceof Error ? error : new Error('No pudimos guardar los cambios del negocio.')
    }
  },

  forgotPassword: async (email) => {
    const response = await forgotPasswordApi(email)
    return response.message
  },

  resetPassword: async ({ token, new_password }) => {
    const response = await resetPasswordApi({ token, new_password })
    return response.message
  },

  changePassword: async ({ current_password, new_password }) => {
    const response = await changePasswordApi({ current_password, new_password })
    return response.message
  },

  listTeamMembers: async (tenantId) => {
    const response = await getTeam(tenantId)
    // El backend responde { members: [...] } (nodo "Responder Miembros Equipo" en el workflow
    // de la API), no el arreglo directo. Antes se comprobaba Array.isArray(response), que
    // siempre era false para ese objeto envuelto, así que la lista de "Miembros del negocio"
    // quedaba vacía sin importar cuántos miembros existieran de verdad en la base de datos.
    const members = unwrapCollection<unknown[]>(response)
    return Array.isArray(members) ? members as Array<{ id: string; email: string; nombre: string; role: 'owner' | 'admin' | 'staff' }> : []
  },

  updateTeamMemberRole: async ({ tenant_id, user_id, role }) => {
    const response = await apiRequest<{ user_id: string; role: 'admin' | 'staff' }>('/api/team/members', {
      method: 'PATCH',
      body: JSON.stringify({ tenant_id, user_id, role }),
    })
    return { user_id: response.user_id, role: response.role }
  },

  removeTeamMember: async ({ tenant_id, user_id }) => {
    const response = await apiRequest<{ message: string }>('/api/team/members', {
      method: 'DELETE',
      body: JSON.stringify({ tenant_id, user_id }),
    })
    return response.message
  },

  inviteTeamMember: async ({ nombre, email, password, role }) => {
    const tenantId = getActiveTenantId()
    const response = await inviteMember(tenantId, { nombre, email, password, role }) as {
      created?: boolean
      user?: { id?: string; email?: string; nombre?: string }
      role?: 'admin' | 'staff'
      password?: string
    }

    const createdUser = response.user ?? { id: 'team-user', email, nombre }
    const responseRole: 'admin' | 'staff' = response.role ?? role
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

      const response = await updateServiceApi(serviceId, tenantId, payload)

      const updated = normalizeService(response ?? { ...currentService, ...patch } as Record<string, unknown>, serviceId)
      set((state) => ({
        services: state.services.map((service) => (service.id === serviceId ? updated : service)),
      }))
    } catch (error) {
      console.warn('The service could not be updated in the backend.', error)
      throw error instanceof Error ? error : new Error('No pudimos actualizar el servicio.')
    }
  },

  cancelAppointment: async (appointmentId) => {
    try {
      const tenantId = getActiveTenantId()
      const response = await updateAppointmentApi({
        id: appointmentId,
        tenant_id: tenantId,
        estado: 'cancelled',
      })

      if (!response || response.cancelled !== true) {
        throw new Error('No pudimos cancelar la cita. Intenta de nuevo.')
      }

      set((state) => ({
        appointments: state.appointments.map((appointment) => appointment.id === appointmentId ? { ...appointment, status: 'cancelled' } : appointment),
      }))
    } catch (error) {
      console.warn('The appointment could not be cancelled in the backend.', error)
      throw error instanceof Error ? error : new Error('No pudimos cancelar la cita.')
    }
  },

  editAppointment: async (appointmentId, patch) => {
    try {
      const tenantId = getActiveTenantId()
      const body: Record<string, unknown> = { id: appointmentId, tenant_id: tenantId }
      if (patch.date !== undefined) body.date = patch.date
      if (patch.time !== undefined) body.start_time = patch.time
      if (patch.serviceId !== undefined) body.service_id = patch.serviceId
      if (patch.amount !== undefined) body.precio = patch.amount

      const response = await updateAppointmentApi(body) as (Record<string, unknown> | null | undefined)

      if (response && typeof response === 'object' && 'rescheduled' in response && response.rescheduled !== true) {
        const reason = String((response as Record<string, unknown>).reason ?? 'BOOKING_FAILED_RETRY')
        const message = reason === 'DAY_CLOSED'
          ? 'El negocio no atiende ese día'
          : reason === 'NO_SLOTS_AVAILABLE'
            ? 'No hay horarios libres ese día'
            : reason === 'CALENDAR_NOT_CONNECTED'
              ? 'Este negocio no tiene Google Calendar conectado'
              : reason === 'CALENDAR_CONFLICT'
                ? 'Ese horario ya no está disponible, elige otro'
                : reason === 'SERVICE_NOT_FOUND'
                  ? 'Este servicio no está disponible para esta sucursal'
                  : reason === 'APPOINTMENT_NOT_FOUND'
                    ? 'No encontramos esta cita. Actualiza la página e intenta de nuevo.'
                    : 'Ocurrió un error, intenta de nuevo'

        set({ lastAppointmentError: message })
        throw new Error(message)
      }

      set({ lastAppointmentError: null })
      await get().hydrateFromApi()
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'No pudimos actualizar la cita.'
      set({ lastAppointmentError: message })
      throw error instanceof Error ? error : new Error(message)
    }
  },

  addService: async (service) => {
    try {
      const tenantId = getActiveTenantId()
      const normalized = await createServiceApi(tenantId, {
        nombre: service.name,
        descripcion: service.description,
        precio: service.price,
        duracion_minutos: service.duration,
      })

      const created = normalizeService(normalized ?? { ...service } as Record<string, unknown>, service.id)

      set((state) => ({
        services: [created, ...state.services.filter((item) => item.id !== created.id)],
      }))
    } catch (error) {
      console.warn('The service could not be synced with the backend.', error)
      throw error instanceof Error ? error : new Error('No pudimos guardar el servicio.')
    }
  },

  addAppointment: async (appointment) => {
    try {
      if (!appointment.customerId || !appointment.serviceId) {
        throw new Error('Customer and service ids are required.')
      }

      const tenantId = getActiveTenantId()
      const response = await createAppointmentApi({
        tenant_id: tenantId,
        customer_id: appointment.customerId,
        service_id: appointment.serviceId,
        date: appointment.date,
        start_time: appointment.time,
      })

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

  addTenantFromServer: (tenant) => {
    const normalized = normalizeTenant((tenant ?? {}) as Record<string, unknown>)

    if (!normalized.id || normalized.id === 'tenant-demo') {
      return
    }

    set((state) => {
      const exists = state.tenants.some((item) => item.id === normalized.id)
      // Un negocio recien creado se marca como pendiente de configurar; uno que ya existia
      // (por ejemplo, refrescado por hydrateFromApi) conserva su estado tal cual.
      const nextTenants = exists
        ? state.tenants.map((item) => (item.id === normalized.id ? normalized : item))
        : [{ ...normalized, needsSetup: true }, ...state.tenants]

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('agendabot_tenants', JSON.stringify(nextTenants))
      }

      return {
        tenants: nextTenants,
      }
    })
  },

  clearTenantSetupFlag: (tenantId) => {
    set((state) => {
      const nextTenants = state.tenants.map((item) =>
        item.id === tenantId ? { ...item, needsSetup: false } : item,
      )

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('agendabot_tenants', JSON.stringify(nextTenants))
      }

      return { tenants: nextTenants }
    })
  },
}))

export { API_BASE_URL }
