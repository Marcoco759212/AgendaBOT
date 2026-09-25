import { apiRequest } from '../lib/api'

export type AppointmentApiRecord = Record<string, unknown>

export async function getAppointments(tenantId: string) {
  return apiRequest<AppointmentApiRecord[]>('/api/appointments', { method: 'GET' }, { tenant_id: tenantId })
}

export async function createAppointment(payload: Record<string, unknown>) {
  return apiRequest<AppointmentApiRecord>('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, { tenant_id: String(payload.tenant_id ?? '') })
}

export async function updateAppointment(payload: Record<string, unknown>) {
  return apiRequest<AppointmentApiRecord>('/api/appointments', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, { tenant_id: String(payload.tenant_id ?? '') })
}
