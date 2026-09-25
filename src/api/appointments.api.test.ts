import { beforeEach, describe, expect, it } from 'vitest'
import { createAppointment, getAppointments, updateAppointment } from './appointments.api'
import { mockFetchOnce, mockFetchRejectOnce } from '../test/mockFetch'

const BASE_URL = 'https://engine.mahrsrv.xyz/webhook'

beforeEach(() => {
  window.localStorage.clear()
})

describe('appointments.api', () => {
  it('getAppointments hace GET a /api/appointments con tenant_id', async () => {
    const fetchMock = mockFetchOnce({ json: [{ id: 'a1' }] })

    const result = await getAppointments('tenant-1')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/appointments?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('GET')
    expect(result).toEqual([{ id: 'a1' }])
  })

  it('createAppointment hace POST con el payload como body y tenant_id como query', async () => {
    const fetchMock = mockFetchOnce({ json: { id: 'a2' } })

    const result = await createAppointment({ tenant_id: 'tenant-1', customer_id: 'c1', service_id: 's1' })

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/appointments?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ tenant_id: 'tenant-1', customer_id: 'c1', service_id: 's1' })
    expect(result).toEqual({ id: 'a2' })
  })

  it('updateAppointment hace PATCH con el payload como body', async () => {
    const fetchMock = mockFetchOnce({ json: { id: 'a2', status: 'cancelled' } })

    await updateAppointment({ tenant_id: 'tenant-1', id: 'a2', status: 'cancelled' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ tenant_id: 'tenant-1', id: 'a2', status: 'cancelled' })
  })

  it('propaga errores 403, 500 y de red al llamar getAppointments', async () => {
    mockFetchOnce({ status: 403, json: { message: 'Sin acceso.' } })
    await expect(getAppointments('tenant-1')).rejects.toThrow('Sin acceso.')

    mockFetchOnce({ status: 500, json: { message: 'Error interno.' } })
    await expect(getAppointments('tenant-1')).rejects.toThrow('Error interno.')

    mockFetchRejectOnce(new TypeError('Failed to fetch'))
    await expect(getAppointments('tenant-1')).rejects.toThrow('Failed to fetch')
  })
})
