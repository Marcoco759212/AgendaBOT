import { beforeEach, describe, expect, it } from 'vitest'
import {
  connectWhatsapp,
  createBusiness,
  disconnectCalendar,
  getBusiness,
  getCalendarStatus,
  getWhatsappStatus,
  updateBusiness,
} from './business.api'
import { mockFetchOnce, mockFetchRejectOnce } from '../test/mockFetch'

const BASE_URL = 'https://engine.mahrsrv.xyz/webhook'

beforeEach(() => {
  window.localStorage.clear()
})

describe('business.api', () => {
  it('getBusiness hace GET a /api/business con tenant_id', async () => {
    const fetchMock = mockFetchOnce({ json: { id: 'tenant-1', nombre: 'Mi negocio' } })

    const result = await getBusiness('tenant-1')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/business?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('GET')
    expect(result).toEqual({ id: 'tenant-1', nombre: 'Mi negocio' })
  })

  it('createBusiness hace POST a /api/business con el payload', async () => {
    const fetchMock = mockFetchOnce({ json: { tenant: { id: 'tenant-2' } } })

    const result = await createBusiness({ nombre_negocio: 'Nuevo negocio', timezone: 'America/Mexico_City' })

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/business`)
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ nombre_negocio: 'Nuevo negocio', timezone: 'America/Mexico_City' })
    expect(result).toEqual({ tenant: { id: 'tenant-2' } })
  })

  it('updateBusiness hace PUT combinando tenant_id y el payload en el body', async () => {
    const fetchMock = mockFetchOnce({ json: {} })

    await updateBusiness('tenant-1', { nombre: 'Nombre actualizado' })

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/business?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('PUT')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ tenant_id: 'tenant-1', nombre: 'Nombre actualizado' })
  })

  it('getCalendarStatus hace GET a /api/business/calendar/status', async () => {
    const fetchMock = mockFetchOnce({ json: { connected: true, state: 'connected', calendar_id: 'cal-1', connected_at: '2026-01-01' } })

    const result = await getCalendarStatus('tenant-1')

    const url = fetchMock.mock.calls[0][0] as URL
    expect(url.toString()).toBe(`${BASE_URL}/api/business/calendar/status?tenant_id=tenant-1`)
    expect(result.connected).toBe(true)
  })

  it('disconnectCalendar hace POST a /api/business/calendar/disconnect', async () => {
    const fetchMock = mockFetchOnce({ json: { disconnected: true } })

    await disconnectCalendar('tenant-1')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/business/calendar/disconnect?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ tenant_id: 'tenant-1' })
  })

  it('getWhatsappStatus hace GET a /api/business/whatsapp/status', async () => {
    const fetchMock = mockFetchOnce({ json: { connected: false, state: 'not_configured', instance_name: null } })

    const result = await getWhatsappStatus('tenant-1')

    const url = fetchMock.mock.calls[0][0] as URL
    expect(url.toString()).toBe(`${BASE_URL}/api/business/whatsapp/status?tenant_id=tenant-1`)
    expect(result.state).toBe('not_configured')
  })

  it('connectWhatsapp hace POST a /api/business/whatsapp/connect', async () => {
    const fetchMock = mockFetchOnce({ json: { connected: false, awaiting_scan: true, instance_name: 'tenant-1', qrcode_base64: 'abc', pairing_code: '123456' } })

    await connectWhatsapp('tenant-1')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/business/whatsapp/connect?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ tenant_id: 'tenant-1' })
  })

  it('propaga errores 403, 500 y de red al llamar getBusiness', async () => {
    mockFetchOnce({ status: 403, json: { message: 'Sin acceso a este negocio.' } })
    await expect(getBusiness('tenant-1')).rejects.toThrow('Sin acceso a este negocio.')

    mockFetchOnce({ status: 500, json: { message: 'Error interno.' } })
    await expect(getBusiness('tenant-1')).rejects.toThrow('Error interno.')

    mockFetchRejectOnce(new TypeError('Failed to fetch'))
    await expect(getBusiness('tenant-1')).rejects.toThrow('Failed to fetch')
  })
})
