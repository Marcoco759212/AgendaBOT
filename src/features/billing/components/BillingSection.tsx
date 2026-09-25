import { CreditCard, Download, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '../../../shared/components/button'
import { Modal } from '../../../shared/components/modal'
import { useAppStore } from '../../../store/useAppStore'

function BillingSection() {
  const {
    billingPlan,
    activeBillingCycle,
    billingInvoices,
    isBillingModalOpen,
    setBillingModalOpen,
    setBillingPlan,
    usageMetrics,
    updateUsageMetric,
    theme,
    tenants,
    activeTenantId,
  } = useAppStore()
  const isDark = theme === 'dark'
  const activeTenantRole = String((tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? 'staff') || 'staff').toLowerCase()
  const canViewBilling = activeTenantRole === 'owner'

  if (!canViewBilling) {
    return (
      <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300' : 'rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm'}>
        Solo el propietario del negocio puede ver la información de facturación.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1.5fr]">
        <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-5' : 'rounded-2xl border border-slate-300 bg-white p-5 shadow-sm'}>
          <div className="flex items-center justify-between">
            <div>
              <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Plan activo</p>
              <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>{billingPlan.name}</h2>
            </div>
            <div className={isDark ? 'rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200' : 'rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-800'}>
              Activo
            </div>
          </div>

          <div className={isDark ? 'mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4' : 'mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-4'}>
            <div className={isDark ? 'flex items-center justify-between text-sm text-slate-300' : 'flex items-center justify-between text-sm text-slate-600'}>
              <span>Próximo cobro automático</span>
              <span className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>14 Oct 2026</span>
            </div>
            <div className={isDark ? 'mt-3 flex items-center justify-between text-sm text-slate-300' : 'mt-3 flex items-center justify-between text-sm text-slate-600'}>
              <span>Precio mensual</span>
              <span className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>${activeBillingCycle === 'annual' ? billingPlan.annualPrice : billingPlan.monthlyPrice} USD</span>
            </div>
            <div className={isDark ? 'mt-3 flex items-center justify-between text-sm text-slate-300' : 'mt-3 flex items-center justify-between text-sm text-slate-600'}>
              <span>Método de pago</span>
              <span className={isDark ? 'inline-flex items-center gap-2 text-white' : 'inline-flex items-center gap-2 text-slate-900'}>
                <CreditCard className="h-4 w-4 text-violet-300" />
                Visa ****4242
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" className="rounded-xl px-4 py-2 text-sm">Editar</Button>
            <Button className="rounded-xl px-4 py-2 text-sm" onClick={() => setBillingModalOpen(true)}>Cambiar de Plan</Button>
          </div>
        </div>

        <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-5' : 'rounded-2xl border border-slate-300 bg-white p-5 shadow-sm'}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Uso</p>
              <h3 className={isDark ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-slate-900'}>Medidores de consumo</h3>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
          </div>

          {usageMetrics.map((metric) => (
            <div key={metric.id} className={isDark ? 'mb-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4' : 'mb-4 rounded-2xl border border-slate-300 bg-slate-50 p-4'}>
              <div className={isDark ? 'mb-2 flex items-center justify-between text-sm text-slate-200' : 'mb-2 flex items-center justify-between text-sm text-slate-700'}>
                <span>{metric.label}</span>
                <span className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>{metric.used} / {metric.limit}</span>
              </div>
              <div className={isDark ? 'h-2.5 overflow-hidden rounded-full bg-slate-800' : 'h-2.5 overflow-hidden rounded-full bg-slate-200'}>
                <div
                  className={`h-full rounded-full ${metric.color}`}
                  style={{ width: `${(metric.used / metric.limit) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-5' : 'rounded-2xl border border-slate-300 bg-white p-5 shadow-sm'}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Facturación</p>
            <h3 className={isDark ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-slate-900'}>Historial de pagos</h3>
          </div>
          <Button variant="secondary" className="rounded-xl px-3 py-2 text-xs">Descargar todo</Button>
        </div>

        <div className={isDark ? 'overflow-hidden rounded-2xl border border-slate-700' : 'overflow-hidden rounded-2xl border border-slate-300'}>
          <table className={isDark ? 'w-full text-left text-sm text-slate-300' : 'w-full text-left text-sm text-slate-700'}>
            <thead className={isDark ? 'bg-slate-950/80 text-xs uppercase tracking-[0.16em] text-slate-400' : 'bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500'}>
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Factura</th>
              </tr>
            </thead>
            <tbody>
              {billingInvoices.map((invoice) => (
                <tr key={invoice.id} className={isDark ? 'border-t border-slate-700' : 'border-t border-slate-300'}>
                  <td className={isDark ? 'px-4 py-3 text-slate-200' : 'px-4 py-3 text-slate-800'}>{invoice.date}</td>
                  <td className={isDark ? 'px-4 py-3 text-slate-200' : 'px-4 py-3 text-slate-800'}>${invoice.amount}</td>
                  <td className="px-4 py-3">
                    <span className={isDark ? 'rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-200' : 'rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-800'}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className={isDark ? 'inline-flex items-center gap-2 rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800' : 'inline-flex items-center gap-2 rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100'}>
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isBillingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        title="Cambiar de plan"
        subtitle="Actualiza tu suscripción según tu volumen actual"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {['Starter', 'Pro', 'Business'].map((planName) => {
            const plan = planName === 'Starter' ? { price: 29, name: 'Starter' } : planName === 'Pro' ? { price: 59, name: 'Pro' } : { price: 119, name: 'Business' }
            const isActive = billingPlan.name === planName
            return (
              <button
                key={planName}
                onClick={() => {
                  setBillingPlan(planName as 'Starter' | 'Pro' | 'Business')
                  setBillingModalOpen(false)
                  if (planName === 'Starter') {
                    updateUsageMetric('conversations', 720, 1000)
                    updateUsageMetric('branches', 2, 3)
                    updateUsageMetric('calendars', 2, 2)
                  }
                  if (planName === 'Pro') {
                    updateUsageMetric('conversations', 720, 1000)
                    updateUsageMetric('branches', 2, 3)
                    updateUsageMetric('calendars', 2, 2)
                  }
                  if (planName === 'Business') {
                    updateUsageMetric('conversations', 720, 5000)
                    updateUsageMetric('branches', 2, 99)
                    updateUsageMetric('calendars', 2, 5)
                  }
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{plan.name}</span>
                  {isActive && <Sparkles className="h-4 w-4 text-emerald-300" />}
                </div>
                <div className="mt-4 text-3xl font-bold">${plan.price}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">/mes</div>
              </button>
            )
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <button className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200">
            Cancelar Suscripción
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default BillingSection
