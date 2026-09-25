import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomerList from './CustomerList'
import { useAppStore } from '../../../store/useAppStore'
import type { Customer, CustomerDetail } from '../../../types'

vi.mock('../../../store/useAppStore', () => ({ useAppStore: vi.fn() }))

const customer: Customer = { id: 'c1', name: 'Ana López', phone: '555-0001', email: 'ana@correo.com', avatar: '' }

const detail: CustomerDetail = {
  id: 'c1',
  name: 'Ana López',
  phone: '555-0001',
  email: 'ana@correo.com',
  appointments: [{ id: 'a1', date: '2026-09-20', status: 'confirmed', amount: 350, service: 'Corte' }],
}

function setupStore(overrides: Partial<Record<string, unknown>> = {}) {
  const state = {
    customers: [customer],
    customerDetail: null,
    loadCustomerDetail: vi.fn().mockResolvedValue(undefined),
    theme: 'dark',
    ...overrides,
  }
  vi.mocked(useAppStore).mockReturnValue(state as unknown as ReturnType<typeof useAppStore>)
  return state
}

describe('CustomerList', () => {
  it('pide el historial al hacer click en un cliente', async () => {
    const user = userEvent.setup()
    const state = setupStore()

    render(<CustomerList />)

    expect(screen.getByText('Selecciona un cliente para ver su historial.')).toBeInTheDocument()

    await user.click(screen.getByText('Ana López'))

    expect(state.loadCustomerDetail).toHaveBeenCalledWith('c1')
  })

  it('muestra el historial de citas cuando hay un cliente seleccionado', () => {
    setupStore({ customerDetail: detail })

    render(<CustomerList />)

    expect(screen.getByText('Corte')).toBeInTheDocument()
    expect(screen.getByText('confirmed')).toBeInTheDocument()
    expect(screen.getByText('$350')).toBeInTheDocument()
  })

  it('muestra "Sin historial de citas" cuando el cliente no tiene citas', () => {
    setupStore({ customerDetail: { ...detail, appointments: [] } })

    render(<CustomerList />)

    expect(screen.getByText('Sin historial de citas.')).toBeInTheDocument()
  })
})
