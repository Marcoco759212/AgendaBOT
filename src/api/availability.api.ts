import { apiRequest } from '../lib/api'

export type AvailabilitySlot = {
  start: string
  end: string
  enabled?: boolean
  prompt_custom_ia?: string
}

export async function getAvailability(tenantId: string, serviceId?: string, date?: string) {
  // serviceId y date son opcionales por compatibilidad, pero el endpoint /api/availability
  // (TOOL - Check Availability) SIEMPRE los requiere para calcular los horarios libres de un
  // dia y servicio especificos; sin ellos el backend no puede resolver la disponibilidad real.
  return apiRequest<Record<string, AvailabilitySlot>>(
    '/api/availability',
    { method: 'GET' },
    { tenant_id: tenantId, service_id: serviceId, date },
  )
}

export async function updateAvailability(tenantId: string, payload: Record<string, AvailabilitySlot>) {
  return apiRequest<Record<string, AvailabilitySlot>>('/api/availability', {
    method: 'PUT',
    body: JSON.stringify({ tenant_id: tenantId, availability: payload }),
  }, { tenant_id: tenantId })
}
