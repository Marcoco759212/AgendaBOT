import { beforeEach, describe, expect, it } from 'vitest'
import { createCustomer, getCustomerDetail, getCustomers } from './customers.api'
import { mockFetchOnce, mockFetchRejectOnce } from '../test/mockFetch'

const BASE_URL = 'https://engine.mahrsrv.xyz/webhook'

beforeEach(() => {
  window.localStorage.clear()
})

describe('customers.api', () => {
  it('getCustomers hace GET a /api/customers con tenant_id', async () => {
    const fetchMock = mockFetchOnce({ json: [{ id: 'c1', name: 'Ana' }] })

    const result = await getCustomers('tenant-1')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/customers?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('GET')
    expect(result).toEqual([{ id: 'c1', name: 'Ana' }])
  })

  it('getCustomerDetail hace GET a /api/customers con tenant_id y customer_id', async () => {
    const fetchMock = mockFetchOnce({ json: { id: 'c1', name: 'Ana' } })

    await getCustomerDetail('tenant-1', 'c1')

    const url = fetchMock.mock.calls[0][0] as URL
    expect(url.toString()).toBe(`${BASE_URL}/api/customers?tenant_id=tenant-1&customer_id=c1`)
  })

  it('createCustomer hace POST combinando tenant_id y el payload en el body', async () => {
    const fetchMock = mockFetchOnce({ json: { id: 'c2' } })

    await createCustomer('tenant-1', { name: 'Luis', phone: '555-0000' })

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/customers?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ tenant_id: 'tenant-1', name: 'Luis', phone: '555-0000' })
  })

  it('propaga errores 403, 500 y de red al llamar getCustomers', async () => {
    mockFetchOnce({ status: 403, json: { message: 'Sin acceso.' } })
    await expect(getCustomers('tenant-1')).rejects.toThrow('Sin acceso.')

    mockFetchOnce({ status: 500, json: { message: 'Error interno.' } })
    await expect(getCustomers('tenant-1')).rejects.toThrow('Error interno.')

    mockFetchRejectOnce(new TypeError('Failed to fetch'))
    await expect(getCustomers('tenant-1')).rejects.toThrow('Failed to fetch')
  })
})
