import { useAppStore } from '../../../store/useAppStore'

export default function CustomerList() {
  const { customers, customerDetail, loadCustomerDetail, theme } = useAppStore()
  const isDark = theme === 'dark'

  return (
    <section className={isDark ? 'grid gap-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 lg:grid-cols-[0.9fr_1.5fr]' : 'grid gap-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm lg:grid-cols-[0.9fr_1.5fr]'}>
      <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-950/70 p-4' : 'rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
        <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Clientes</p>
        <div className="mt-4 space-y-2">
          {customers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => void loadCustomerDetail(customer.id)}
              className={isDark ? 'flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-left text-sm text-slate-200' : 'flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-700'}
            >
              <span>{customer.name}</span>
              <span className={isDark ? 'text-[10px] uppercase tracking-[0.18em] text-slate-400' : 'text-[10px] uppercase tracking-[0.18em] text-slate-500'}>{customer.phone}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-950/70 p-4' : 'rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
        {customerDetail ? (
          <>
            <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Historial</p>
            <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>{customerDetail.name}</h2>
            <p className={isDark ? 'mt-2 text-sm text-slate-400' : 'mt-2 text-sm text-slate-600'}>{customerDetail.phone} · {customerDetail.email || 'email no disponible'}</p>

            <div className="mt-5 space-y-3">
              {customerDetail.appointments.length > 0 ? customerDetail.appointments.map((appointment) => (
                <div key={appointment.id} className={isDark ? 'rounded-xl border border-slate-700 bg-slate-900/80 p-3' : 'rounded-xl border border-slate-200 bg-white p-3'}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={isDark ? 'text-sm font-medium text-white' : 'text-sm font-medium text-slate-900'}>{appointment.service}</span>
                    <span className={appointment.status === 'cancelled' ? 'rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-rose-200' : appointment.status === 'confirmed' ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-200' : 'rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-200'}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className={isDark ? 'mt-2 flex items-center justify-between text-xs text-slate-400' : 'mt-2 flex items-center justify-between text-xs text-slate-500'}>
                    <span>{appointment.date}</span>
                    <span>${appointment.amount.toLocaleString()}</span>
                  </div>
                </div>
              )) : (
                <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-600'}>Sin historial de citas.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-600'}>Selecciona un cliente para ver su historial.</p>
          </div>
        )}
      </div>
    </section>
  )
}
