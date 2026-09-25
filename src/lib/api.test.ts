import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './api'
import { mockFetchOnce, mockFetchRejectOnce } from '../test/mockFetch'

const BASE_URL = 'https://engine.mahrsrv.xyz/webhook'

function makeToken(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

// forceLogout hace `window.location.href = '/login'`. Sustituir el objeto location completo por
// uno "plano" (en vez de usar el de jsdom) permite capturar esa asignación como un dato normal,
// sin que jsdom intente navegar de verdad y sin el warning "Not implemented: navigation" en consola.
function stubLocation(pathname: string) {
  const original = window.location
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...original, pathname, href: `http://localhost${pathname}` } as unknown as Location,
  })
  return () => {
    Object.defineProperty(window, 'location', { configurable: true, value: original })
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('apiRequest - construccion de la peticion', () => {
  it('arma la URL con la base configurada y agrega los query params, saltando undefined/null/vacios', async () => {
    const fetchMock = mockFetchOnce({ json: { ok: true } })

    await apiRequest('/api/services', { method: 'GET' }, { tenant_id: 'tenant-1', include_inactive: false, empty: '', missing: undefined })

    const calledUrl = fetchMock.mock.calls[0][0] as URL
    expect(calledUrl.toString()).toBe(`${BASE_URL}/api/services?tenant_id=tenant-1&include_inactive=false`)
  })

  it('agrega Content-Type: application/json cuando hay body y no viene ya especificado', async () => {
    const fetchMock = mockFetchOnce({ json: {} })

    await apiRequest('/api/services', { method: 'POST', body: JSON.stringify({ nombre: 'Corte' }) })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Headers
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('no agrega Content-Type cuando el body es FormData', async () => {
    const fetchMock = mockFetchOnce({ json: {} })
    const formData = new FormData()
    formData.append('file', 'x')

    await apiRequest('/api/upload', { method: 'POST', body: formData })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Headers
    expect(headers.has('Content-Type')).toBe(false)
  })

  it('agrega X-Api-Key desde VITE_API_KEY cuando esta configurada', async () => {
    vi.stubEnv('VITE_API_KEY', 'clave-de-prueba')
    const fetchMock = mockFetchOnce({ json: {} })

    await apiRequest('/api/services', { method: 'GET' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Headers
    expect(headers.get('X-Api-Key')).toBe('clave-de-prueba')
  })

  it('no sobrescribe un X-Api-Key ya presente en los headers del caller', async () => {
    vi.stubEnv('VITE_API_KEY', 'clave-global')
    const fetchMock = mockFetchOnce({ json: {} })

    await apiRequest('/api/services', { method: 'GET', headers: { 'X-Api-Key': 'clave-especifica' } })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Headers
    expect(headers.get('X-Api-Key')).toBe('clave-especifica')
  })

  it('agrega Authorization: Bearer <token> cuando hay un token vigente en localStorage', async () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 })
    window.localStorage.setItem('agendabot_token', token)
    const fetchMock = mockFetchOnce({ json: {} })

    await apiRequest('/api/services', { method: 'GET' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe(`Bearer ${token}`)
  })
})

describe('apiRequest - sesion expirada', () => {
  it('rechaza sin llamar a fetch y limpia la sesion cuando el token JWT ya expiro', async () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 60 })
    window.localStorage.setItem('agendabot_token', token)
    window.localStorage.setItem('agendabot_user', '{"id":"u1"}')
    const fetchMock = mockFetchOnce({ json: {} })
    const restoreLocation = stubLocation('/dashboard')

    await expect(apiRequest('/api/services', { method: 'GET' })).rejects.toThrow('Tu sesión expiró. Inicia sesión nuevamente.')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('agendabot_token')).toBeNull()
    expect(window.localStorage.getItem('agendabot_user')).toBeNull()
    expect(window.location.href).toBe('/login')

    restoreLocation()
  })
})

describe('apiRequest - respuestas exitosas', () => {
  it('devuelve el JSON parseado cuando la respuesta es exitosa', async () => {
    mockFetchOnce({ json: { id: 'svc-1', nombre: 'Corte' } })

    const result = await apiRequest<{ id: string; nombre: string }>('/api/services', { method: 'GET' })

    expect(result).toEqual({ id: 'svc-1', nombre: 'Corte' })
  })

  it('devuelve una cadena vacia (no lanza) cuando el body viene vacio, aunque el Content-Type sea json', async () => {
    mockFetchOnce({ text: '', contentType: 'application/json' })

    const result = await apiRequest('/api/services', { method: 'PATCH', body: JSON.stringify({}) })

    expect(result).toBe('')
  })

  it('trata un body JSON malformado como respuesta nula, en vez de reventar la llamada', async () => {
    mockFetchOnce({ text: 'not-valid-json{', contentType: 'application/json' })

    const result = await apiRequest('/api/services', { method: 'PATCH', body: JSON.stringify({}) })

    expect(result).toBeNull()
  })
})

describe('apiRequest - errores del backend', () => {
  it('lanza el mensaje del campo "message" cuando la respuesta no es 2xx', async () => {
    mockFetchOnce({ status: 403, json: { message: 'No tienes permisos para esta accion.' } })

    await expect(apiRequest('/api/team/members', { method: 'DELETE' })).rejects.toThrow('No tienes permisos para esta accion.')
  })

  it('lanza el mensaje del campo "error" cuando no hay "message"', async () => {
    mockFetchOnce({ status: 500, json: { error: 'Error interno del servidor.' } })

    await expect(apiRequest('/api/services', { method: 'GET' })).rejects.toThrow('Error interno del servidor.')
  })

  it('lanza un mensaje generico cuando la respuesta no es JSON ni trae message/error', async () => {
    mockFetchOnce({ status: 500, text: '', contentType: null })

    await expect(apiRequest('/api/services', { method: 'GET' })).rejects.toThrow('La solicitud a la API falló.')
  })

  it('en 401 sobre un endpoint protegido, cierra la sesion ademas de lanzar el error', async () => {
    window.localStorage.setItem('agendabot_token', 'token-invalido')
    mockFetchOnce({ status: 401, json: { message: 'Token invalido.' } })
    const restoreLocation = stubLocation('/dashboard')

    await expect(apiRequest('/api/team/members', { method: 'GET' })).rejects.toThrow('Token invalido.')

    expect(window.localStorage.getItem('agendabot_token')).toBeNull()
    expect(window.location.href).toBe('/login')

    restoreLocation()
  })

  it('en 401 sobre un endpoint de auth (login), NO cierra la sesion', async () => {
    window.localStorage.setItem('agendabot_token', 'algo-que-no-debe-borrarse')
    mockFetchOnce({ status: 401, json: { message: 'Credenciales invalidas.' } })

    await expect(apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({}) })).rejects.toThrow('Credenciales invalidas.')

    expect(window.localStorage.getItem('agendabot_token')).toBe('algo-que-no-debe-borrarse')
  })

  it('en 403, NO cierra la sesion (solo 401 dispara el logout global)', async () => {
    window.localStorage.setItem('agendabot_token', 'token-que-sigue-siendo-valido')
    mockFetchOnce({ status: 403, json: { message: 'Rol insuficiente.' } })

    await expect(apiRequest('/api/team/members', { method: 'DELETE' })).rejects.toThrow('Rol insuficiente.')

    expect(window.localStorage.getItem('agendabot_token')).toBe('token-que-sigue-siendo-valido')
  })

  it('propaga el error cuando la red esta caida (fetch rechaza)', async () => {
    mockFetchRejectOnce(new TypeError('Failed to fetch'))

    await expect(apiRequest('/api/services', { method: 'GET' })).rejects.toThrow('Failed to fetch')
  })
})
