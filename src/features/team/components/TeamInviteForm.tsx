import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '../../../store/useAppStore'

export default function TeamInviteForm() {
  const { inviteTeamMember, theme } = useAppStore()
  const isDark = theme === 'dark'
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'staff'>('admin')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ nombre: string; email: string; role: 'admin' | 'staff'; password: string } | null>(null)

  const generatePassword = () => {
    const random = Math.random().toString(36).slice(2, 10)
    const suffix = Math.random().toString(36).slice(2, 6)
    const next = `${random}${suffix}!`
    setPassword(next)
    setShowPassword(true)
  }

  const handleSubmit = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError('Completa nombre, correo y contraseña temporal.')
      setSuccess(null)
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const result = await inviteTeamMember({ nombre: nombre.trim(), email: email.trim(), password, role })
      setSuccess({
        nombre: result.user.nombre,
        email: result.user.email,
        role: result.role,
        password: result.password,
      })
      setNombre('')
      setEmail('')
      setPassword('')
      setRole('admin')
      setShowPassword(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos crear la cuenta del equipo.'
      setSuccess(null)
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyPassword = async () => {
    if (!success?.password) return
    try {
      await navigator.clipboard.writeText(success.password)
    } catch {
      // Ignorado a propósito: si falla, el usuario igual puede copiar la contraseña manualmente.
    }
  }

  return (
    <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-5' : 'rounded-2xl border border-slate-300 bg-white p-5 shadow-sm'}>
      <div className="mb-5">
        <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Equipo</p>
        <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>Invitar miembro</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Nombre</label>
          <input
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej. Ana García"
            className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500'}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ana@negocio.com"
            className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500'}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Contraseña temporal</label>
          <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5' : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5'}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={isDark ? 'w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500' : 'w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500'}
            />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className={isDark ? 'text-slate-300' : 'text-slate-600'} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={generatePassword} className={isDark ? 'text-xs font-medium text-violet-300' : 'text-xs font-medium text-violet-700'}>
              Generar contraseña
            </button>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Rol</label>
          <div className={isDark ? 'grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-2 md:grid-cols-2' : 'grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 md:grid-cols-2'}>
            {[
              { value: 'admin', label: 'Administrador', description: 'Control total del tenant' },
              { value: 'staff', label: 'Personal / Staff', description: 'Acceso limitado a tareas' },
            ].map((option) => {
              const selected = role === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value as 'admin' | 'staff')}
                  className={[
                    'rounded-xl border p-3 text-left transition-all duration-200',
                    selected
                      ? isDark
                        ? 'border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(52,211,153,0.2)]'
                        : 'border-emerald-300 bg-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]'
                      : isDark
                        ? 'border-slate-700 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>{option.label}</span>
                    <span className={[
                      'flex h-5 w-5 items-center justify-center rounded-full border',
                      selected
                        ? isDark
                          ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                          : 'border-emerald-500 bg-emerald-500 text-white'
                        : isDark
                          ? 'border-slate-600 bg-slate-900 text-slate-500'
                          : 'border-slate-300 bg-white text-slate-400',
                    ].join(' ')}>
                      {selected ? '✓' : ''}
                    </span>
                  </div>
                  <p className={isDark ? 'mt-2 text-xs leading-5 text-slate-400' : 'mt-2 text-xs leading-5 text-slate-500'}>{option.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className={isDark ? 'mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'}>
          {error}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className={isDark ? 'rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60' : 'rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60'}
        >
          {isSubmitting ? 'Creando…' : 'Crear cuenta'}
        </button>
      </div>

      {success && (
        <div className={isDark ? 'mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4' : 'mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4'}>
          <p className={isDark ? 'text-sm font-medium text-emerald-200' : 'text-sm font-medium text-emerald-800'}>Cuenta creada correctamente.</p>
          <div className={isDark ? 'mt-3 space-y-2 text-sm text-slate-200' : 'mt-3 space-y-2 text-sm text-slate-700'}>
            <p><span className="font-medium">Nombre:</span> {success.nombre}</p>
            <p><span className="font-medium">Correo:</span> {success.email}</p>
            <p><span className="font-medium">Rol:</span> {success.role === 'admin' ? 'Administrador' : 'Personal / Staff'}</p>
            <div className={isDark ? 'rounded-xl border border-slate-700 bg-slate-950/80 p-3' : 'rounded-xl border border-slate-200 bg-white p-3'}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">Contraseña temporal</span>
                <button onClick={() => void copyPassword()} className={isDark ? 'rounded-lg border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-200' : 'rounded-lg border border-slate-300 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-700'}>
                  Copiar
                </button>
              </div>
              <p className={isDark ? 'mt-2 break-all font-mono text-xs text-emerald-200' : 'mt-2 break-all font-mono text-xs text-emerald-700'}>{success.password}</p>
            </div>
            <p className={isDark ? 'text-xs text-slate-300' : 'text-xs text-slate-600'}>
              Esta persona debe cambiar la contraseña la primera vez que inicie sesión.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
