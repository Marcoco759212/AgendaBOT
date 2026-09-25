import { beforeEach, describe, expect, it } from 'vitest'
import { getAvailability, updateAvailability } from './availability.api'
import { mockFetchOnce, mockFetchRejectOnce } from '../test/mockFetch'

const BASE_URL = 'https://engine.mahrsrv.xyz/webhook'

beforeEach(() => {
  window.localStorage.clear()
})

describe('availability.api', () => {
  it('getAvailability hace GET a /api/availability con tenant_id', async () => {
    const fetchMock = mockFetchOnce({ json: { lunes: { start: '09:00', end: '18:00', enabled: true } } })

    const result = await getAvailability('tenant-1')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/availability?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('GET')
    expect(result).toEqual({ lunes: { start: '09:00', end: '18:00', enabled: true } })
  })

  it('updateAvailability hace PUT con tenant_id y availability en el body', async () => {
    const fetchMock = mockFetchOnce({ json: {} })
    const payload = { lunes: { start: '09:00', end: '18:00', enabled: true } }

    await updateAvailability('tenant-1', payload)

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/availability?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('PUT')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ tenant_id: 'tenant-1', availability: payload })
  })

  it('propaga errores 403, 500 y de red al llamar getAvailability', async () => {
    mockFetchOnce({ status: 403, json: { message: 'Sin acceso.' } })
    await expect(getAvailability('tenant-1')).rejects.toThrow('Sin acceso.')

    mockFetchOnce({ status: 500, json: { message: 'Error interno.' } })
    await expect(getAvailability('tenant-1')).rejects.toThrow('Error interno.')

    mockFetchRejectOnce(new TypeError('Failed to fetch'))
    await expect(getAvailability('tenant-1')).rejects.toThrow('Failed to fetch')
  })
})
