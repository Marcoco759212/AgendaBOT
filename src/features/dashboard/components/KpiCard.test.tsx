import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import KpiCard from './KpiCard'
import { useAppStore } from '../../../store/useAppStore'
import type { AnalyticsKpi } from '../../../types'

vi.mock('../../../store/useAppStore', () => ({ useAppStore: vi.fn() }))

const kpi: AnalyticsKpi = {
  id: 'kpi-1',
  label: 'Citas confirmadas',
  value: '128',
  delta: '+12%',
  positive: true,
  accent: 'emerald',
}

function setupStore(overrides: Partial<Record<string, unknown>> = {}) {
  const state = { theme: 'dark', ...overrides }
  vi.mocked(useAppStore).mockReturnValue(state as unknown as ReturnType<typeof useAppStore>)
}

describe('KpiCard', () => {
  it('muestra la etiqueta, el valor y el delta del KPI', () => {
    setupStore()

    render(<KpiCard item={kpi} />)

    expect(screen.getByText('Citas confirmadas')).toBeInTheDocument()
    expect(screen.getByText('128')).toBeInTheDocument()
    expect(screen.getByText('+12%')).toBeInTheDocument()
    expect(screen.getByText('Positivo')).toBeInTheDocument()
  })

  it('muestra "Revisión" cuando el KPI no es positivo', () => {
    setupStore()

    render(<KpiCard item={{ ...kpi, positive: false }} />)

    expect(screen.getByText('Revisión')).toBeInTheDocument()
  })
})
