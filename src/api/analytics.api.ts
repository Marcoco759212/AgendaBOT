import { apiRequest } from '../lib/api'

export type AnalyticsSummary = Record<string, unknown>

export async function getSummary(tenantId: string, range = '30d') {
  return apiRequest<AnalyticsSummary>('/api/analytics/summary', { method: 'GET' }, { tenant_id: tenantId, range })
}

export async function getRecentActivity(tenantId: string, limit = 10) {
  return apiRequest<unknown[]>('/api/activity/recent', { method: 'GET' }, { tenant_id: tenantId, limit: String(limit) })
}
