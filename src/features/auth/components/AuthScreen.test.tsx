import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AuthScreen from './AuthScreen'
import { useAppStore } from '../../../store/useAppStore'

vi.mock('../../../store/useAppStore', () => ({ useAppStore: vi.fn() }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function setupStore(overrides: Partial<Record<string, unknown>> = {}) {
  const state = {
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    theme: 'dark',
    setTheme: vi.fn(),
    isAuthenticated: false,
    isSessionReady: true,
    restoreSession: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  vi.mocked(useAppStore).mockReturnValue(state as unknown as ReturnType<typeof useAppStore>)
  return state
}

describe('AuthScreen', () => {
  it('muestra un estado de carga mientras la sesion no esta lista, sin exponer el formulario', () => {
    setupStore({ isSessionReady: false })

    render(<AuthScreen mode="login" />, { wrapper: MemoryRouter })

    expect(screen.getByText('Cargando sesión…')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Entrar al panel' })).not.toBeInTheDocument()
  })

  it('en modo login, envia email y password recortados y navega al dashboard', async () => {
    const user = userEvent.setup()
    const state = setupStore()

    render(<AuthScreen mode="login" />, { wrapper: MemoryRouter })

    await user.type(screen.getByPlaceholderText('dueno@negocio.com'), '  dueno@negocio.com  ')
    await user.type(screen.getByPlaceholderText('••••••••'), 'secreto123')
    await user.click(screen.getByRole('button', { name: 'Entrar al panel' }))

    expect(state.login).toHaveBeenCalledWith('dueno@negocio.com', 'secreto123')
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('muestra el mensaje de error del backend cuando el login falla', async () => {
    const user = userEvent.setup()
    const state = setupStore({ login: vi.fn().mockRejectedValue(new Error('Credenciales inválidas.')) })

    render(<AuthScreen mode="login" />, { wrapper: MemoryRouter })

    await user.type(screen.getByPlaceholderText('dueno@negocio.com'), 'dueno@negocio.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'incorrecta')
    await user.click(screen.getByRole('button', { name: 'Entrar al panel' }))

    expect(await screen.findByText('Credenciales inválidas.')).toBeInTheDocument()
    expect(state.login).toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard', { replace: true })
  })
})
