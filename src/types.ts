export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled'
export type ViewName = 'landing' | 'dashboard' | 'calendar' | 'clients' | 'services' | 'billing' | 'account' | 'settings' | 'team'
export type BillingCycle = 'monthly' | 'annual'
export type PlanName = 'Starter' | 'Pro' | 'Business'

export interface TenantDaySchedule {
  start: string
  end: string
  enabled: boolean
  prompt_custom_ia: string
}

export interface Tenant {
  id: string
  name: string
  city: string
  speciality: string
  address: string
  locationReference?: string
  timezone?: string
  promptCustomIa?: string
  horarioAtencion?: Record<string, TenantDaySchedule> | null
  active: boolean
  calendarLinked: boolean
  role?: 'owner' | 'admin' | 'staff'
  needsSetup?: boolean
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  avatar: string
}

export interface Service {
  id: string
  name: string
  duration: number
  price: number
  description: string
  category: string
  activo?: boolean
}

export interface Appointment {
  id: string
  tenantId: string
  customer: Customer
  service: string
  serviceId?: string
  date: string
  time: string
  status: AppointmentStatus
  channel: 'WhatsApp' | 'Instagram' | 'Web' | 'Google Calendar'
  notes: string[]
  amount: number
}

export interface AnalyticsKpi {
  id: string
  label: string
  value: string
  delta: string
  positive: boolean
  accent: 'emerald' | 'violet' | 'amber' | 'rose'
}

export interface BillingPlan {
  id: string
  name: PlanName
  monthlyPrice: number
  annualPrice: number
  description: string
  featured?: boolean
  features: string[]
  limits: {
    conversations: number
    branches: number
    calendars: number
  }
}

export interface AnalyticsSummaryResponse {
  kpis: Record<string, number | string>
  bookings_by_day: Array<{ day: string; bookings: number }>
  hourly_demand: Array<{ hour: string; demand: number }>
  service_mix: Array<{ name: string; value: number }>
}

export interface RecentActivityItem {
  id: string
  message: string
  time: string
  type: 'success' | 'ai' | 'pending' | 'sync'
}

export interface CustomerDetail {
  id: string
  name: string
  phone: string
  email: string | null
  appointments: Array<{
    id: string
    date: string
    status: AppointmentStatus
    amount: number
    service: string
  }>
}

export interface BillingInvoice {
  id: string
  date: string
  amount: number
  status: 'Pagado' | 'Pendiente'
  plan: PlanName
}

export interface AvailabilitySlot {
  id: string
  day: string
  start: string
  end: string
  available: boolean
}
