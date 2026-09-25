import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppointmentList from './AppointmentList'
import { useAppStore } from '../../../store/useAppStore'
import type { Appointment } from '../../../types'

vi.mock('../../../store/useAppStore', () => ({ useAppStore: vi.fn() }))

const baseAppointment: Appointment = {
  id: 'appt-1',
  tenantId: 'tenant-1',
  customer: { id: 'c1', name: 'Ana López', phone: '555-0001', email: 'ana@correo.com', avatar: '' },
  service: 'Corte de cabello',
  date: '2026-09-25',
  time: '10:00',
  status: 'confirmed',
  channel: 'WhatsApp',
  notes: [],
  amount: 350,
}

function setupStore(overrides: Partial<Record<string, unknown>> = {}) {
  const state = {
    appointments: [baseAppointment],
    activeTenantId: 'tenant-1',
    statusFilter: 'all',
    setSelectedAppointmentId: vi.fn(),
    cancelAppointment: vi.fn().mockResolvedValue(undefined),
    theme: 'dark',
    ...overrides,
  }
  vi.mocked(useAppStore).mockReturnValue(state as unknown as ReturnType<typeof useAppStore>)
  return state
}

describe('AppointmentList', () => {
  it('solo muestra las citas del tenant activo que coinciden con el filtro de estado', () => {
    const otherTenantAppointment: Appointment = { ...baseAppointment, id: 'appt-2', tenantId: 'otro-tenant', customer: { ...baseAppointment.customer, name: 'Cliente de otro negocio' } }
    const cancelledAppointment: Appointment = { ...baseAppointment, id: 'appt-3', status: 'cancelled', customer: { ...baseAppointment.customer, name: 'Cita cancelada' } }
    setupStore({ appointments: [baseAppointment, otherTenantAppointment, cancelledAppointment], statusFilter: 'confirmed' })

    render(<AppointmentList />)

    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.queryByText('Cliente de otro negocio')).not.toBeInTheDocument()
    expect(screen.queryByText('Cita cancelada')).not.toBeInTheDocument()
  })

  it('al hacer click en una cita la selecciona, y al confirmar cancelar en el tooltip la cancela', async () => {
    const user = userEvent.setup()
    const state = setupStore()
    render(<AppointmentList />)

    await user.click(screen.getByText('Ana López'))
    expect(state.setSelectedAppointmentId).toHaveBeenCalledWith('appt-1')

    expect(screen.queryByRole('button', { name: 'Cancelar cita' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Más opciones' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar cita' }))
    expect(state.cancelAppointment).toHaveBeenCalledWith('appt-1')
  })
})
