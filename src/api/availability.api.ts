import { apiRequest } from '../lib/api'

export type AvailabilitySlot = {
  start: string
  end: string
  enabled?: boolean
  prompt_custom_ia?: string
}

export async function getAvailability(tenantId: string) {
  return apiRequest<Record<string, AvailabilitySlot>>('/api/availability', { method: 'GET' }, { tenant_id: tenantId })
}

export async function updateAvailability(tenantId: string, payload: Record<string, AvailabilitySlot>) {
  return apiRequest<Record<string, AvailabilitySlot>>('/api/availability', {
    method: 'PUT',
    body: JSON.stringify({ tenant_id: tenantId, availability: payload }),
  }, { tenant_id: tenantId })
}
