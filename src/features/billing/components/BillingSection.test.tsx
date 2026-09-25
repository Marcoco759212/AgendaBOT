import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BillingSection from './BillingSection'
import { useAppStore } from '../../../store/useAppStore'
import type { Tenant } from '../../../types'

vi.mock('../../../store/useAppStore', () => ({ useAppStore: vi.fn() }))

const ownerTenant: Tenant = {
  id: 'tenant-1',
  name: 'Mi negocio',
  city: 'CDMX',
  speciality: 'Barbería',
  address: '',
  active: true,
  calendarLinked: true,
  role: 'owner',
}

function setupStore(overrides: Partial<Record<string, unknown>> = {}) {
  const state = {
    billingPlan: { id: 'plan-pro', name: 'Pro', monthlyPrice: 59, annualPrice: 590, description: '', features: [], limits: { conversations: 1000, branches: 3, calendars: 2 } },
    activeBillingCycle: 'monthly',
    billingInvoices: [],
    isBillingModalOpen: false,
    setBillingModalOpen: vi.fn(),
    setBillingPlan: vi.fn(),
    usageMetrics: [],
    updateUsageMetric: vi.fn(),
    theme: 'dark',
    tenants: [ownerTenant],
    activeTenantId: 'tenant-1',
    ...overrides,
  }
  vi.mocked(useAppStore).mockReturnValue(state as unknown as ReturnType<typeof useAppStore>)
  return state
}

describe('BillingSection', () => {
  it('restringe la vista de facturacion a los roles distintos de owner', () => {
    setupStore({ tenants: [{ ...ownerTenant, role: 'staff' }] })

    render(<BillingSection />)

    expect(screen.getByText('Solo el propietario del negocio puede ver la información de facturación.')).toBeInTheDocument()
    expect(screen.queryByText('Plan activo')).not.toBeInTheDocument()
  })

  it('el owner ve su plan activo y puede abrir el modal para cambiar de plan', async () => {
    const user = userEvent.setup()
    const state = setupStore()

    render(<BillingSection />)

    expect(screen.getByText('Pro')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cambiar de Plan' }))

    expect(state.setBillingModalOpen).toHaveBeenCalledWith(true)
  })

  it('al elegir un plan en el modal abierto, actualiza el plan y cierra el modal', async () => {
    const user = userEvent.setup()
    const state = setupStore({ isBillingModalOpen: true })

    render(<BillingSection />)

    await user.click(screen.getByRole('button', { name: /Business/ }))

    expect(state.setBillingPlan).toHaveBeenCalledWith('Business')
    expect(state.setBillingModalOpen).toHaveBeenCalledWith(false)
    expect(state.updateUsageMetric).toHaveBeenCalledWith('conversations', 720, 5000)
  })
})
