import { beforeEach, describe, expect, it } from 'vitest'
import { createService, getServices, updateService } from './services.api'
import { mockFetchOnce, mockFetchRejectOnce } from '../test/mockFetch'

const BASE_URL = 'https://engine.mahrsrv.xyz/webhook'

beforeEach(() => {
  window.localStorage.clear()
})

describe('services.api', () => {
  it('getServices hace GET con tenant_id e include_inactive=false por defecto', async () => {
    const fetchMock = mockFetchOnce({ json: [{ id: 's1' }] })

    const result = await getServices('tenant-1')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/services?tenant_id=tenant-1&include_inactive=false`)
    expect((init as RequestInit).method).toBe('GET')
    expect(result).toEqual([{ id: 's1' }])
  })

  it('getServices manda include_inactive=true cuando se pide explicitamente', async () => {
    const fetchMock = mockFetchOnce({ json: [] })

    await getServices('tenant-1', true)

    const url = fetchMock.mock.calls[0][0] as URL
    expect(url.toString()).toContain('include_inactive=true')
  })

  it('createService hace POST combinando tenant_id y el payload en el body', async () => {
    const fetchMock = mockFetchOnce({ json: { id: 's2' } })

    await createService('tenant-1', { nombre: 'Corte', precio: 200 })

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/services?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ tenant_id: 'tenant-1', nombre: 'Corte', precio: 200 })
  })

  it('updateService hace PATCH incluyendo el id del servicio y tenant_id en el body', async () => {
    const fetchMock = mockFetchOnce({ json: { id: 's2', activo: false } })

    await updateService('s2', 'tenant-1', { activo: false })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ id: 's2', tenant_id: 'tenant-1', activo: false })
  })

  it('propaga errores 403, 500 y de red al llamar getServices', async () => {
    mockFetchOnce({ status: 403, json: { message: 'Sin acceso.' } })
    await expect(getServices('tenant-1')).rejects.toThrow('Sin acceso.')

    mockFetchOnce({ status: 500, json: { message: 'Error interno.' } })
    await expect(getServices('tenant-1')).rejects.toThrow('Error interno.')

    mockFetchRejectOnce(new TypeError('Failed to fetch'))
    await expect(getServices('tenant-1')).rejects.toThrow('Failed to fetch')
  })
})
