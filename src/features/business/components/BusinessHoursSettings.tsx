import { useEffect, useState } from 'react'
import { Button } from '../../../shared/components/button'
import { useAppStore } from '../../../store/useAppStore'

type DaySchedule = { start: string; end: string; enabled: boolean; prompt_custom_ia: string }

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const DEFAULT_PROMPT = 'Atiende citas, confirma disponibilidad y responde con tono profesional.'

const DEFAULT_SCHEDULE: Record<string, DaySchedule> = {
  mon: { start: '09:00', end: '18:00', enabled: true, prompt_custom_ia: DEFAULT_PROMPT },
  tue: { start: '09:00', end: '18:00', enabled: true, prompt_custom_ia: DEFAULT_PROMPT },
  wed: { start: '09:00', end: '18:00', enabled: true, prompt_custom_ia: DEFAULT_PROMPT },
  thu: { start: '09:00', end: '18:00', enabled: true, prompt_custom_ia: DEFAULT_PROMPT },
  fri: { start: '09:00', end: '18:00', enabled: true, prompt_custom_ia: DEFAULT_PROMPT },
  sat: { start: '10:00', end: '15:00', enabled: false, prompt_custom_ia: DEFAULT_PROMPT },
  sun: { start: '10:00', end: '13:00', enabled: false, prompt_custom_ia: DEFAULT_PROMPT },
}

// Combina lo que ya esta guardado para el negocio con los valores por defecto, dia por dia
// (por si el negocio nunca configuro alguno). Antes este componente ignoraba por completo lo
// que venia del backend y siempre arrancaba desde DEFAULT_SCHEDULE, sin importar el negocio.
const buildSchedule = (saved?: Record<string, Partial<DaySchedule>> | null): Record<string, DaySchedule> =>
  Object.fromEntries(
    DAY_KEYS.map((day) => {
      const base = DEFAULT_SCHEDULE[day]
      const override = saved?.[day]

      return [day, {
        start: override?.start || base.start,
        end: override?.end || base.end,
        enabled: override?.enabled ?? base.enabled,
        prompt_custom_ia: override?.prompt_custom_ia || base.prompt_custom_ia,
      }]
    }),
  )

export default function BusinessHoursSettings() {
  const { tenants, updateBusiness, theme, activeTenantId } = useAppStore()
  const isDark = theme === 'dark'
  const activeTenantRole = String((tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? 'staff') || 'staff').toLowerCase()
  const canManageBusiness = activeTenantRole === 'owner' || activeTenantRole === 'admin'
  const business = tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0]
  const [horarioAtencion, setHorarioAtencion] = useState<Record<string, DaySchedule>>(() => buildSchedule(business?.horarioAtencion))
  const [isSaving, setIsSaving] = useState(false)

  // Igual que en Configuracion del negocio: si cambias de tenant sin que este componente se
  // desmonte, hay que refrescar el horario mostrado con el del negocio nuevo (o con los
  // valores por defecto si ese negocio nunca configuro uno), en vez de dejar el del anterior.
  useEffect(() => {
    setHorarioAtencion(buildSchedule(business?.horarioAtencion))
  }, [activeTenantId, business?.horarioAtencion])

  const updateDay = (day: keyof typeof horarioAtencion, patch: Partial<DaySchedule>) => {
    setHorarioAtencion((current) => ({
      ...current,
      [day]: {
        start: current[day]?.start ?? '09:00',
        end: current[day]?.end ?? '18:00',
        enabled: current[day]?.enabled ?? true,
        prompt_custom_ia: current[day]?.prompt_custom_ia ?? DEFAULT_PROMPT,
        ...patch,
      },
    }))
  }

  const handleSave = async () => {
    if (!canManageBusiness) return

    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
    const normalizedSchedule: Record<string, DaySchedule> = Object.fromEntries(
      dayKeys.map((day) => {
        const current = horarioAtencion[day] ?? DEFAULT_SCHEDULE[day]

        return [day, {
          start: current.start || '09:00',
          end: current.end || '18:00',
          enabled: current.enabled ?? true,
          prompt_custom_ia: current.prompt_custom_ia || DEFAULT_PROMPT,
        }]
      }),
    )

    try {
      setIsSaving(true)
      await updateBusiness({
        id: business?.id ?? activeTenantId,
        horario_atencion: normalizedSchedule,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!canManageBusiness) {
    return (
      <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300' : 'rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm'}>
        Solo el propietario del tenant puede editar el horario de atención.
      </div>
    )
  }

  return (
    <div className={isDark ? 'rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-[0_10px_40px_rgba(15,23,42,0.35)]' : 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm'}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className={isDark ? 'text-[10px] uppercase tracking-[0.24em] text-slate-400' : 'text-[10px] uppercase tracking-[0.24em] text-slate-500'}>Disponibilidad</p>
          <h3 className={isDark ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-900'}>Horario de atención</h3>
        </div>
        <Button onClick={() => void handleSave()} disabled={isSaving} className="px-4 py-2 text-sm">
          {isSaving ? 'Guardando…' : 'Guardar horario'}
        </Button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(horarioAtencion).map(([day, value]) => (
          <div key={day} className={isDark ? 'rounded-xl border border-slate-700 bg-slate-950/70 p-2.5' : 'rounded-xl border border-slate-300 bg-slate-50 p-2.5'}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className={isDark ? 'text-xs font-medium uppercase tracking-[0.18em] text-slate-300' : 'text-xs font-medium uppercase tracking-[0.18em] text-slate-700'}>{day}</span>
              <label className={isDark ? 'inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-300' : 'inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-600'}>
                <input
                  type="checkbox"
                  checked={value.enabled}
                  onChange={(event) => updateDay(day as keyof typeof horarioAtencion, { enabled: event.target.checked })}
                  className={isDark ? 'h-3.5 w-3.5 rounded border-slate-500 bg-slate-950' : 'h-3.5 w-3.5 rounded border-slate-400 bg-white'}
                />
                Activo
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={value.start}
                onChange={(event) => updateDay(day as keyof typeof horarioAtencion, { start: event.target.value })}
                className={isDark ? 'w-full rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-2 text-xs text-white' : 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900'}
                placeholder="09:00"
              />
              <input
                value={value.end}
                onChange={(event) => updateDay(day as keyof typeof horarioAtencion, { end: event.target.value })}
                className={isDark ? 'w-full rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-2 text-xs text-white' : 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900'}
                placeholder="18:00"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
