import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TeamMembersList from './TeamMembersList'
import { useAppStore } from '../../../store/useAppStore'
import type { Tenant } from '../../../types'

vi.mock('../../../store/useAppStore', () => ({ useAppStore: vi.fn() }))

const ownerTenant: Tenant = { id: 'tenant-1', name: 'Mi negocio', city: 'CDMX', speciality: 'Barbería', address: '', active: true, calendarLinked: true, role: 'owner' }

const members = [
  { id: 'owner-1', email: 'owner@negocio.com', nombre: 'Dueña', role: 'owner' as const },
  { id: 'admin-1', email: 'harlet@negocio.com', nombre: 'Harlet', role: 'admin' as const },
]

function setupStore(overrides: Partial<Record<string, unknown>> = {}) {
  const state = {
    listTeamMembers: vi.fn().mockResolvedValue(members),
    theme: 'dark',
    activeTenantId: 'tenant-1',
    user: { id: 'owner-1' },
    tenants: [ownerTenant],
    updateTeamMemberRole: vi.fn().mockResolvedValue({ user_id: 'admin-1', role: 'staff' }),
    removeTeamMember: vi.fn().mockResolvedValue({ message: 'ok' }),
    ...overrides,
  }
  vi.mocked(useAppStore).mockReturnValue(state as unknown as ReturnType<typeof useAppStore>)
  return state
}

describe('TeamMembersList', () => {
  it('carga y muestra a los miembros del equipo al montarse (regresion del bug de "miembros vacios")', async () => {
    const state = setupStore()

    render(<TeamMembersList />)

    expect(screen.getByText('Loading equipo…')).toBeInTheDocument()

    expect(await screen.findByText('Harlet')).toBeInTheDocument()
    expect(screen.getByText('harlet@negocio.com')).toBeInTheDocument()
    expect(state.listTeamMembers).toHaveBeenCalledWith('tenant-1')
  })

  it('muestra el mensaje de error cuando falla la carga del equipo', async () => {
    setupStore({ listTeamMembers: vi.fn().mockRejectedValue(new Error('No pudimos cargar el equipo.')) })

    render(<TeamMembersList />)

    expect(await screen.findByText('No pudimos cargar el equipo.')).toBeInTheDocument()
  })

  it('el owner puede confirmar la eliminacion de un miembro que no es el ni el owner', async () => {
    const user = userEvent.setup()
    const state = setupStore()

    render(<TeamMembersList />)

    await screen.findByText('Harlet')

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByText(/quieres quitar a/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(state.removeTeamMember).toHaveBeenCalledWith({ tenant_id: 'tenant-1', user_id: 'admin-1' }))
  })
})
