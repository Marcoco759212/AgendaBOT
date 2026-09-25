import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Se ejecuta una vez antes de cada archivo de test (ver vitest.config.ts -> test.setupFiles).
afterEach(() => {
  // Desmonta cualquier componente renderizado por @testing-library/react en el test anterior.
  cleanup()
  // apiRequest lee/escribe el token de sesión en localStorage; sin este reset, un test que deja
  // un token guardado podría filtrarse al siguiente y hacerlo pasar (o fallar) por la razón
  // equivocada.
  window.localStorage.clear()
  // Restaura fetch/otros globals stubbeados con vi.stubGlobal (ver src/test/mockFetch.ts) y
  // limpia cualquier spy que haya quedado activo.
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
