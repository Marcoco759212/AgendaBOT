import { apiRequest } from '../lib/api'

export type ServiceApiRecord = Record<string, unknown>

export async function getServices(tenantId: string, includeInactive = false) {
  return apiRequest<ServiceApiRecord[]>('/api/services', { method: 'GET' }, { tenant_id: tenantId, include_inactive: includeInactive })
}

export async function createService(tenantId: string, payload: Record<string, unknown>) {
  return apiRequest<ServiceApiRecord>('/api/services', {
    method: 'POST',
    body: JSON.stringify({ tenant_id: tenantId, ...payload }),
  }, { tenant_id: tenantId })
}

export async function updateService(serviceId: string, tenantId: string, payload: Record<string, unknown>) {
  return apiRequest<ServiceApiRecord>('/api/services', {
    method: 'PATCH',
    body: JSON.stringify({ id: serviceId, tenant_id: tenantId, ...payload }),
  }, { tenant_id: tenantId })
}
