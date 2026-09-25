import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/button'
import { useAppStore } from '../../../store/useAppStore'

const roleLabel: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  staff: 'Equipo',
}

export default function MyBusinessesList() {
  const { tenants, activeTenantId, setActiveTenant, clearTenantSetupFlag, setQuickCreateType, theme } = useAppStore()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const handleSelect = (tenantId: string, needsSetup?: boolean) => {
    setActiveTenant(tenantId)
    if (needsSetup) {
      clearTenantSetupFlag(tenantId)
      navigate('/dashboard/settings')
    }
  }

  return (
    <section className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-5' : 'rounded-2xl border border-slate-300 bg-white p-5 shadow-sm'}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Mi cuenta</p>
          <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>Mis negocios</h2>
          <p className={isDark ? 'mt-1 text-sm text-slate-400' : 'mt-1 text-sm text-slate-600'}>
            Cada negocio tiene su propio calendario, servicios y equipo, sin compartir datos entre sí.
          </p>
        </div>
        <Button onClick={() => setQuickCreateType('branch')} className="shrink-0 rounded-xl px-4 py-2 text-sm">
          Agregar negocio
        </Button>
      </div>

      <div className="space-y-2">
        {tenants.map((tenant) => {
          const isActive = tenant.id === activeTenantId
          return (
            <div
              key={tenant.id}
              className={isDark
                ? `flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${isActive ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-700 bg-slate-950/60'}`
                : `flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${isActive ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={isDark ? 'truncate text-sm font-semibold text-white' : 'truncate text-sm font-semibold text-slate-900'}>{tenant.name}</p>
                  {isActive && (
                    <span className={isDark ? 'shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300' : 'shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700'}>
                      Activo
                    </span>
                  )}
                  {tenant.needsSetup && (
                    <span className={isDark ? 'shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300' : 'shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700'}>
                      Pendiente de configurar
                    </span>
                  )}
                </div>
                <p className={isDark ? 'mt-0.5 truncate text-xs text-slate-400' : 'mt-0.5 truncate text-xs text-slate-500'}>
                  {tenant.city} · {roleLabel[tenant.role ?? 'staff'] ?? 'Equipo'}
                </p>
              </div>

              {!isActive && (
                <button
                  type="button"
                  onClick={() => handleSelect(tenant.id, tenant.needsSetup)}
                  className={isDark
                    ? 'shrink-0 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800'
                    : 'shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white'}
                >
                  Seleccionar
                </button>
              )}
            </div>
          )
        })}

        {tenants.length === 0 && (
          <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-600'}>Aún no tienes negocios registrados.</p>
        )}
      </div>
    </section>
  )
}
