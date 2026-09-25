import { beforeEach, describe, expect, it } from 'vitest'
import { getTeam, inviteMember } from './team.api'
import { mockFetchOnce, mockFetchRejectOnce } from '../test/mockFetch'

const BASE_URL = 'https://engine.mahrsrv.xyz/webhook'

beforeEach(() => {
  window.localStorage.clear()
})

describe('team.api', () => {
  it('getTeam hace GET a /api/team/members con tenant_id', async () => {
    // El backend real responde { members: [...] } (ver el fix de unwrapCollection en
    // useAppStore), pero desenvolver esa forma es responsabilidad del store, no de este
    // wrapper: aqui solo verificamos que se pide el endpoint correcto y que apiRequest
    // devuelve el payload tal cual llega, sin transformarlo.
    const fetchMock = mockFetchOnce({ json: { members: [{ id: 'u1', email: 'a@b.com', nombre: 'Ana', role: 'admin' }] } })

    const result = await getTeam('tenant-1')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/team/members?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('GET')
    expect(result).toEqual({ members: [{ id: 'u1', email: 'a@b.com', nombre: 'Ana', role: 'admin' }] })
  })

  it('inviteMember hace POST a /api/team/invite combinando tenant_id y el payload en el body', async () => {
    const fetchMock = mockFetchOnce({ json: { id: 'u2' } })

    await inviteMember('tenant-1', { nombre: 'Harlet', email: 'harlet@negocio.com', password: '12345678a', role: 'admin' })

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/team/invite?tenant_id=tenant-1`)
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      tenant_id: 'tenant-1',
      nombre: 'Harlet',
      email: 'harlet@negocio.com',
      password: '12345678a',
      role: 'admin',
    })
  })

  it('propaga errores 403, 500 y de red al llamar getTeam', async () => {
    mockFetchOnce({ status: 403, json: { message: 'Sin acceso al equipo.' } })
    await expect(getTeam('tenant-1')).rejects.toThrow('Sin acceso al equipo.')

    mockFetchOnce({ status: 500, json: { message: 'Error interno.' } })
    await expect(getTeam('tenant-1')).rejects.toThrow('Error interno.')

    mockFetchRejectOnce(new TypeError('Failed to fetch'))
    await expect(getTeam('tenant-1')).rejects.toThrow('Failed to fetch')
  })
})
