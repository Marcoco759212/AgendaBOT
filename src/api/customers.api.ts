import { apiRequest } from '../lib/api'

export type CustomerApiRecord = Record<string, unknown>

export async function getCustomers(tenantId: string) {
  return apiRequest<CustomerApiRecord[]>('/api/customers', { method: 'GET' }, { tenant_id: tenantId })
}

export async function getCustomerDetail(tenantId: string, customerId: string) {
  return apiRequest<CustomerApiRecord>('/api/customers', { method: 'GET' }, { tenant_id: tenantId, customer_id: customerId })
}

export async function createCustomer(tenantId: string, payload: Record<string, unknown>) {
  return apiRequest<CustomerApiRecord>('/api/customers', {
    method: 'POST',
    body: JSON.stringify({ tenant_id: tenantId, ...payload }),
  }, { tenant_id: tenantId })
}
