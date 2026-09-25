import { beforeEach, describe, expect, it } from 'vitest'
import { getRecentActivity, getSummary } from './analytics.api'
import { mockFetchOnce, mockFetchRejectOnce } from '../test/mockFetch'

const BASE_URL = 'https://engine.mahrsrv.xyz/webhook'

beforeEach(() => {
  window.localStorage.clear()
})

describe('analytics.api', () => {
  it('getSummary hace GET a /api/analytics/summary con tenant_id y range, y devuelve el resumen', async () => {
    const fetchMock = mockFetchOnce({ json: { kpis: {}, bookings_by_day: [], hourly_demand: [], service_mix: [] } })

    const result = await getSummary('tenant-1', '7d')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/analytics/summary?tenant_id=tenant-1&range=7d`)
    expect((init as RequestInit).method).toBe('GET')
    expect(result).toEqual({ kpis: {}, bookings_by_day: [], hourly_demand: [], service_mix: [] })
  })

  it('getSummary usa "30d" como rango por defecto', async () => {
    const fetchMock = mockFetchOnce({ json: {} })

    await getSummary('tenant-1')

    const url = fetchMock.mock.calls[0][0] as URL
    expect(url.toString()).toContain('range=30d')
  })

  it('getRecentActivity hace GET a /api/activity/recent con tenant_id y limit', async () => {
    const fetchMock = mockFetchOnce({ json: [{ id: 'a1' }] })

    const result = await getRecentActivity('tenant-1', 5)

    const url = fetchMock.mock.calls[0][0] as URL
    expect(url.toString()).toBe(`${BASE_URL}/api/activity/recent?tenant_id=tenant-1&limit=5`)
    expect(result).toEqual([{ id: 'a1' }])
  })

  it('propaga errores 403, 500 y de red al llamar getSummary', async () => {
    mockFetchOnce({ status: 403, json: { message: 'Sin acceso a este negocio.' } })
    await expect(getSummary('tenant-1')).rejects.toThrow('Sin acceso a este negocio.')

    mockFetchOnce({ status: 500, json: { message: 'Error interno.' } })
    await expect(getSummary('tenant-1')).rejects.toThrow('Error interno.')

    mockFetchRejectOnce(new TypeError('Failed to fetch'))
    await expect(getSummary('tenant-1')).rejects.toThrow('Failed to fetch')
  })
})
