import { beforeEach, describe, expect, it } from 'vitest'
import { changePassword, forgotPassword, login, register, resetPassword } from './auth.api'
import { mockFetchOnce, mockFetchRejectOnce } from '../test/mockFetch'

const BASE_URL = 'https://engine.mahrsrv.xyz/webhook'

beforeEach(() => {
  window.localStorage.clear()
})

describe('auth.api', () => {
  it('login hace POST a /api/auth/login con email y password', async () => {
    const fetchMock = mockFetchOnce({ json: { token: 'jwt-123' } })

    const result = await login('dueno@negocio.com', 'secreto123')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/auth/login`)
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ email: 'dueno@negocio.com', password: 'secreto123' })
    expect(result).toEqual({ token: 'jwt-123' })
  })

  it('register hace POST a /api/auth/register con el payload completo', async () => {
    const fetchMock = mockFetchOnce({ json: { token: 'jwt-456' } })
    const payload = { email: 'nuevo@negocio.com', password: 'secreto123', nombre_negocio: 'Mi negocio', nombre_usuario: 'Ana' }

    await register(payload)

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual(payload)
  })

  it('forgotPassword hace POST a /api/auth/forgot-password con el email', async () => {
    const fetchMock = mockFetchOnce({ json: { message: 'Revisa tu correo.' } })

    await forgotPassword('dueno@negocio.com')

    const [url, init] = fetchMock.mock.calls[0]
    expect((url as URL).toString()).toBe(`${BASE_URL}/api/auth/forgot-password`)
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ email: 'dueno@negocio.com' })
  })

  it('resetPassword hace POST a /api/auth/reset-password con token y new_password', async () => {
    const fetchMock = mockFetchOnce({ json: { message: 'Contraseña actualizada.' } })

    await resetPassword({ token: 'reset-token', new_password: 'nuevaClave123' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({ token: 'reset-token', new_password: 'nuevaClave123' })
  })

  it('changePassword hace POST a /api/auth/change-password con las contraseñas', async () => {
    const fetchMock = mockFetchOnce({ json: { message: 'Contraseña actualizada.' } })

    await changePassword({ current_password: 'actual123', new_password: 'nueva123' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({ current_password: 'actual123', new_password: 'nueva123' })
  })

  it('propaga el mensaje de error cuando el login falla con 401 (credenciales invalidas)', async () => {
    mockFetchOnce({ status: 401, json: { message: 'Credenciales invalidas.' } })

    await expect(login('dueno@negocio.com', 'incorrecta')).rejects.toThrow('Credenciales invalidas.')
  })

  it('propaga error 500 y caida de red en login', async () => {
    mockFetchOnce({ status: 500, json: { message: 'Error interno.' } })
    await expect(login('a@b.com', 'x')).rejects.toThrow('Error interno.')

    mockFetchRejectOnce(new TypeError('Failed to fetch'))
    await expect(login('a@b.com', 'x')).rejects.toThrow('Failed to fetch')
  })
})
