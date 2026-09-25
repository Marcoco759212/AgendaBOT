import { apiRequest } from '../lib/api'

export type BusinessRecord = Record<string, unknown>

export type CreateBusinessResponse = {
  tenant?: {
    id?: string
    nombre?: string
    slug?: string
    timezone?: string
    direccion?: string | null
    role?: 'owner' | 'admin' | 'staff'
  }
}

export async function getBusiness(tenantId: string) {
  return apiRequest<BusinessRecord>('/api/business', { method: 'GET' }, { tenant_id: tenantId })
}

export async function createBusiness(payload: { nombre_negocio: string; timezone?: string }) {
  return apiRequest<CreateBusinessResponse>('/api/business', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateBusiness(tenantId: string, payload: Record<string, unknown>) {
  return apiRequest<BusinessRecord>('/api/business', {
    method: 'PUT',
    body: JSON.stringify({ tenant_id: tenantId, ...payload }),
  }, { tenant_id: tenantId })
}

export async function getCalendarStatus(tenantId: string) {
  return apiRequest<{ connected: boolean; state: 'connected' | 'not_connected' | 'needs_reconnect'; calendar_id: string | null; connected_at: string | null }>('/api/business/calendar/status', { method: 'GET' }, { tenant_id: tenantId })
}

export async function disconnectCalendar(tenantId: string) {
  return apiRequest<{ disconnected: true }>('/api/business/calendar/disconnect', {
    method: 'POST',
    body: JSON.stringify({ tenant_id: tenantId }),
  }, { tenant_id: tenantId })
}

export async function getWhatsappStatus(tenantId: string) {
  return apiRequest<{ connected: boolean; state: 'open' | 'close' | 'connecting' | 'not_configured'; instance_name: string | null }>('/api/business/whatsapp/status', { method: 'GET' }, { tenant_id: tenantId })
}

export async function connectWhatsapp(tenantId: string) {
  return apiRequest<{ connected: boolean; awaiting_scan: boolean; instance_name: string; qrcode_base64: string; pairing_code: string }>('/api/business/whatsapp/connect', {
    method: 'POST',
    body: JSON.stringify({ tenant_id: tenantId }),
  }, { tenant_id: tenantId })
}
