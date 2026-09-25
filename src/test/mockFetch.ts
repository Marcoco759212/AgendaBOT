import { vi } from 'vitest'

type MockFetchResponseInit = {
  status?: number
  ok?: boolean
  json?: unknown
  text?: string
  /** Pasa null para simular una respuesta sin Content-Type (o uno que no sea JSON). */
  contentType?: string | null
}

/**
 * Reemplaza el `fetch` global con un mock que resuelve una sola respuesta, imitando la forma
 * mínima de `Response` que usa `apiRequest` en src/lib/api.ts (`ok`, `status`, `headers.get`,
 * `text`). Se usa mock de fetch en vez de msw porque `apiRequest` es el único punto de contacto
 * con `fetch` en todo el frontend: mockear `fetch` directamente cubre los mismos casos con mucho
 * menos código y sin depender de un service worker en el entorno de test.
 */
export function mockFetchOnce(init: MockFetchResponseInit = {}) {
  const status = init.status ?? 200
  const ok = init.ok ?? (status >= 200 && status < 300)
  const contentType = init.contentType === undefined ? 'application/json' : init.contentType
  const bodyText = init.text !== undefined ? init.text : init.json !== undefined ? JSON.stringify(init.json) : ''

  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    headers: {
      get: (name: string) => (contentType && name.toLowerCase() === 'content-type' ? contentType : null),
    },
    text: () => Promise.resolve(bodyText),
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Simula una caída de red: `fetch` rechaza en vez de resolver una respuesta HTTP. */
export function mockFetchRejectOnce(error: Error = new Error('Failed to fetch')) {
  const fetchMock = vi.fn().mockRejectedValue(error)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
