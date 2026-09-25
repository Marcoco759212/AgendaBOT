import { apiRequest } from '../lib/api'

export type TeamMember = Record<string, unknown>

export async function getTeam(tenantId: string) {
  return apiRequest<TeamMember[]>('/api/team/members', { method: 'GET' }, { tenant_id: tenantId })
}

export async function inviteMember(tenantId: string, payload: Record<string, unknown>) {
  return apiRequest<TeamMember>('/api/team/invite', {
    method: 'POST',
    body: JSON.stringify({ tenant_id: tenantId, ...payload }),
  }, { tenant_id: tenantId })
}
