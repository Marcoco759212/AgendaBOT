import { apiRequest } from '../lib/api'

export type AuthLoginResponse = {
  token: string
  user?: Record<string, unknown>
  tenants?: Array<Record<string, unknown>>
}

export type AuthRegisterResponse = {
  token: string
  user?: Record<string, unknown>
  tenant?: Record<string, unknown>
}

export async function login(email: string, password: string) {
  return apiRequest<AuthLoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function register(payload: { email: string; password: string; nombre_negocio: string; nombre_usuario: string; timezone?: string }) {
  return apiRequest<AuthRegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function forgotPassword(email: string) {
  return apiRequest<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword({ token, new_password }: { token: string; new_password: string }) {
  return apiRequest<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password }),
  })
}

export async function changePassword({ current_password, new_password }: { current_password: string; new_password: string }) {
  return apiRequest<{ message: string }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  })
}
