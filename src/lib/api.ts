export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://engine.mahrsrv.xyz/webhook'

export type ApiParams = Record<string, string | number | boolean | undefined | null>

// Estos endpoints no requieren autenticación y no deben disparar el logout global aunque
// el backend responda con 400/401 por validación de credenciales o enlaces inválidos.
const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password']

const isAuthEndpoint = (endpoint: string) => AUTH_ENDPOINTS.some((path) => endpoint.startsWith(path))

// Limpia la sesión guardada y manda al usuario a /login. Se usa tanto cuando detectamos
// localmente que el JWT ya expiró, como cuando el backend responde 401/403 en cualquier
// endpoint protegido (token inválido, revocado, o sin membresía en el tenant actual).
const forceLogout = () => {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem('agendabot_token')
  window.localStorage.removeItem('agendabot_user')
  window.localStorage.removeItem('agendabot_tenants')
  window.localStorage.removeItem('agendabot_active_tenant_id')

  if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
    window.location.href = '/login'
  }
}

export async function apiRequest<T>(
  endpoint: string,
  init: RequestInit = {},
  params?: ApiParams,
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      url.searchParams.set(key, String(value))
    })
  }

  const headers = new Headers(init.headers ?? {})

  if (!headers.has('X-Api-Key')) {
    const apiKey = import.meta.env.VITE_API_KEY
    if (apiKey) {
      headers.set('X-Api-Key', apiKey)
    }
  }

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('agendabot_token') : null
  if (token) {
    try {
      const base64Payload = token.split('.')[1]
      if (base64Payload) {
        const payload = JSON.parse(atob(base64Payload))
        if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
          forceLogout()
          throw new Error('Tu sesión expiró. Inicia sesión nuevamente.')
        }
      }
      headers.set('Authorization', `Bearer ${token}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('sesión expiró')) {
        throw error
      }
    }
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...init,
    headers,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const rawText = await response.text()
  // Algunos nodos "Respond to Webhook" (modo firstIncomingItem) mandan Content-Type: application/json
  // con el cuerpo vacio cuando el nodo anterior no produjo ningun item (ej. un UPDATE ... RETURNING
  // que no encontro filas). response.json() truena con "Unexpected end of JSON input" en ese caso;
  // lo tratamos como body vacio en vez de dejar que la excepcion reviente la llamada.
  let payload: unknown = rawText
  if (contentType.includes('application/json') && rawText) {
    try {
      payload = JSON.parse(rawText)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const payloadObject = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null
    const message =
      typeof payload === 'string' && payload
        ? payload
        : (payloadObject?.message as string | undefined) || (payloadObject?.error as string | undefined) || 'La solicitud a la API falló.'

    if (response.status === 401 && !isAuthEndpoint(endpoint)) {
      forceLogout()
    }

    throw new Error(message)
  }

  return payload as T
}

export async function forgotPassword({ email }: { email: string }) {
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

export async function listTeamMembers(tenant_id: string) {
  return apiRequest<{ members: Array<{ id: string; email: string; nombre: string; role: 'owner' | 'admin' | 'staff' }> }>('/api/team/members', { method: 'GET' }, { tenant_id })
}

export async function updateTeamMemberRole({ tenant_id, user_id, role }: { tenant_id: string; user_id: string; role: 'admin' | 'staff' }) {
  return apiRequest<{ user_id: string; role: 'admin' | 'staff' }>('/api/team/members', {
    method: 'PATCH',
    body: JSON.stringify({ tenant_id, user_id, role }),
  })
}

export async function removeTeamMember({ tenant_id, user_id }: { tenant_id: string; user_id: string }) {
  return apiRequest<{ message: string }>('/api/team/members', {
    method: 'DELETE',
    body: JSON.stringify({ tenant_id, user_id }),
  })
}
