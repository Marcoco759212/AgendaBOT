import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MyBusinessesList from './MyBusinessesList'
import { useAppStore } from '../../../store/useAppStore'
import type { Tenant } from '../../../types'

vi.mock('../../../store/useAppStore', () => ({ useAppStore: vi.fn() }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const activeTenant: Tenant = { id: 'tenant-1', name: 'Negocio activo', city: 'CDMX', speciality: 'Barbería', address: '', active: true, calendarLinked: true, role: 'owner' }
const pendingTenant: Tenant = { id: 'tenant-2', name: 'Negocio nuevo', city: 'Monterrey', speciality: 'Spa', address: '', active: true, calendarLinked: false, role: 'owner', needsSetup: true }

function setupStore(overrides: Partial<Record<string, unknown>> = {}) {
  const state = {
    tenants: [activeTenant, pendingTenant],
    activeTenantId: 'tenant-1',
    setActiveTenant: vi.fn(),
    clearTenantSetupFlag: vi.fn(),
    setQuickCreateType: vi.fn(),
    theme: 'dark',
    ...overrides,
  }
  vi.mocked(useAppStore).mockReturnValue(state as unknown as ReturnType<typeof useAppStore>)
  return state
}

describe('MyBusinessesList', () => {
  it('marca el negocio activo y muestra "Pendiente de configurar" en los que lo necesitan', () => {
    setupStore()

    render(<MyBusinessesList />, { wrapper: MemoryRouter })

    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de configurar')).toBeInTheDocument()
  })

  it('al seleccionar un negocio pendiente de configurar, lo activa y navega a ajustes', async () => {
    const user = userEvent.setup()
    const state = setupStore()

    render(<MyBusinessesList />, { wrapper: MemoryRouter })

    await user.click(screen.getByRole('button', { name: 'Seleccionar' }))

    expect(state.setActiveTenant).toHaveBeenCalledWith('tenant-2')
    expect(state.clearTenantSetupFlag).toHaveBeenCalledWith('tenant-2')
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/settings')
  })

  it('muestra un mensaje cuando no hay negocios registrados', () => {
    setupStore({ tenants: [], activeTenantId: '' })

    render(<MyBusinessesList />, { wrapper: MemoryRouter })

    expect(screen.getByText('Aún no tienes negocios registrados.')).toBeInTheDocument()
  })
})
