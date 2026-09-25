import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceCatalog from './ServiceCatalog'
import { useAppStore } from '../../../store/useAppStore'
import type { Tenant } from '../../../types'

vi.mock('../../../store/useAppStore', () => ({ useAppStore: vi.fn() }))

// ServiceCatalog usa apiRequest directamente (no un wrapper de src/api) para cargar servicios
// inactivos bajo demanda, pero solo cuando showInactive es true. Ninguno de los flujos que
// probamos aqui lo activa, asi que este mock nunca deberia invocarse; lo dejamos explicito para
// que un fetch real jamas se dispare por accidente si el componente cambia.
vi.mock('../../../lib/api', () => ({ apiRequest: vi.fn().mockResolvedValue({ services: [] }) }))

const ownerTenant: Tenant = { id: 'tenant-1', name: 'Mi negocio', city: 'CDMX', speciality: 'Barbería', address: '', active: true, calendarLinked: true, role: 'owner' }

function setupStore(overrides: Partial<Record<string, unknown>> = {}) {
  const state = {
    services: [],
    addService: vi.fn().mockResolvedValue(undefined),
    updateService: vi.fn().mockResolvedValue(undefined),
    hydrateFromApi: vi.fn().mockResolvedValue(undefined),
    theme: 'dark',
    tenants: [ownerTenant],
    activeTenantId: 'tenant-1',
    ...overrides,
  }
  vi.mocked(useAppStore).mockReturnValue(state as unknown as ReturnType<typeof useAppStore>)
  return state
}

describe('ServiceCatalog', () => {
  it('restringe el alta de servicios a los roles owner y admin', () => {
    setupStore({ tenants: [{ ...ownerTenant, role: 'staff' }] })

    render(<ServiceCatalog />)

    expect(screen.getByText('Solo los roles owner y admin pueden crear o editar servicios para este tenant.')).toBeInTheDocument()
    expect(screen.queryByText('Registrar servicio')).not.toBeInTheDocument()
  })

  it('registra un servicio nuevo con los valores por defecto de duracion y precio', async () => {
    const user = userEvent.setup()
    const state = setupStore()

    render(<ServiceCatalog />)

    await user.type(screen.getByPlaceholderText('Nombre del servicio'), 'Corte de cabello')
    await user.type(screen.getByPlaceholderText('Descripción para IA'), 'Corte clásico con máquina y tijera.')
    await user.click(screen.getByRole('button', { name: 'Añadir servicio' }))

    expect(state.addService).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Corte de cabello',
        description: 'Corte clásico con máquina y tijera.',
        duration: 45,
        price: 1200,
        category: 'Nuevo',
        activo: true,
      }),
    )
  })

  it('no registra el servicio si falta el nombre o la descripcion', async () => {
    const user = userEvent.setup()
    const state = setupStore()

    render(<ServiceCatalog />)

    await user.click(screen.getByRole('button', { name: 'Añadir servicio' }))

    expect(state.addService).not.toHaveBeenCalled()
  })

  it('muestra un mensaje cuando no hay servicios activos', () => {
    setupStore()

    render(<ServiceCatalog />)

    expect(screen.getByText('No hay servicios activos en este tenant.')).toBeInTheDocument()
  })
})
