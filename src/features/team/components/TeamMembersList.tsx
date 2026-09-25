import { useEffect, useState } from 'react'
import SelectMenu from '../../../shared/components/SelectMenu'
import { useAppStore } from '../../../store/useAppStore'

export default function TeamMembersList() {
  const { listTeamMembers, theme, activeTenantId, user, tenants, updateTeamMemberRole, removeTeamMember } = useAppStore()
  const isDark = theme === 'dark'
  const [members, setMembers] = useState<Array<{ id: string; email: string; nombre: string; role: 'owner' | 'admin' | 'staff' }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState<{ id: string; name: string } | null>(null)

  const activeTenantRole = String((tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? 'staff') || 'staff').toLowerCase()
  const isOwner = activeTenantRole === 'owner'

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true)
        const data = await listTeamMembers(activeTenantId)
        setMembers(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No pudimos cargar el equipo.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void loadMembers()
  }, [activeTenantId, listTeamMembers])

  const handleRoleChange = async (userId: string, role: 'admin' | 'staff') => {
    try {
      setError('')
      const response = await updateTeamMemberRole({ tenant_id: activeTenantId, user_id: userId, role })
      setMembers((current) => current.map((member) => member.id === userId ? { ...member, role: response.role } : member))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos actualizar el rol.'
      setError(message)
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      setError('')
      await removeTeamMember({ tenant_id: activeTenantId, user_id: userId })
      setMembers((current) => current.filter((member) => member.id !== userId))
      setPendingAction(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos eliminar al miembro.'
      setError(message)
    }
  }

  const currentUserId = user.id ?? ''

  return (
    <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-5' : 'rounded-2xl border border-slate-300 bg-white p-5 shadow-sm'}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Equipo</p>
          <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>Miembros del negocio</h2>
        </div>
      </div>

      {error && (
        <div className={isDark ? 'mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-600'}>Loading equipo…</div>
      ) : members.length === 0 ? (
        <div className={isDark ? 'rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300' : 'rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600'}>
          No hay miembros en este tenant.
        </div>
      ) : (
        <div className={isDark ? 'overflow-hidden rounded-2xl border border-slate-700' : 'overflow-hidden rounded-2xl border border-slate-200'}>
          <div className={isDark ? 'grid grid-cols-[1.4fr_1.2fr_1fr_0.9fr] gap-3 bg-slate-950/90 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-slate-400' : 'grid grid-cols-[1.4fr_1.2fr_1fr_0.9fr] gap-3 bg-slate-100 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-slate-500'}>
            <span>Nombre</span>
            <span>Correo</span>
            <span>Rol</span>
            <span>Acciones</span>
          </div>

          {members.map((member) => {
            const isOwnerMember = member.role === 'owner'
            const isCurrentUser = member.id === currentUserId
            const canEditRole = isOwner && !isOwnerMember && !isCurrentUser

            return (
              <div key={member.id} className={isDark ? 'grid grid-cols-[1.4fr_1.2fr_1fr_0.9fr] items-center gap-3 border-t border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-200' : 'grid grid-cols-[1.4fr_1.2fr_1fr_0.9fr] items-center gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-700'}>
                <span className="font-medium">{member.nombre}</span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{member.email}</span>
                <div>
                  {canEditRole ? (
                    <SelectMenu
                      value={member.role as 'admin' | 'staff'}
                      options={[
                        { value: 'admin', label: 'Administrador' },
                        { value: 'staff', label: 'Personal' },
                      ]}
                      onChange={(role) => void handleRoleChange(member.id, role)}
                      isDark={isDark}
                    />
                  ) : (
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{member.role === 'owner' ? 'Propietario' : member.role === 'admin' ? 'Administrador' : 'Personal'}</span>
                  )}
                </div>
                <div>
                  {isOwner && !isOwnerMember && !isCurrentUser ? (
                    <button
                      type="button"
                      onClick={() => setPendingAction({ id: member.id, name: member.nombre })}
                      className={isDark ? 'rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[10px] uppercase tracking-[0.18em] text-rose-200' : 'rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[10px] uppercase tracking-[0.18em] text-rose-700'}
                    >
                      Eliminar
                    </button>
                  ) : (
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pendingAction && (
        <div className={isDark ? 'mt-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-4' : 'mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4'}>
          <p className={isDark ? 'text-sm text-slate-200' : 'text-sm text-slate-700'}>
            ¿Seguro que quieres quitar a <span className="font-semibold">{pendingAction.name}</span> del equipo?
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setPendingAction(null)} className={isDark ? 'rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200' : 'rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700'}>
              Cancelar
            </button>
            <button type="button" onClick={() => void handleRemove(pendingAction.id)} className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white">
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

