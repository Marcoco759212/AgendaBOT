import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppStore } from '../../../store/useAppStore'

export default function ResetPasswordScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword, theme } = useAppStore()
  const isDark = theme === 'dark'
  const token = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Falta el token de recuperación. Solicita un nuevo enlace.')
      return
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)

    try {
      const message = await resetPassword({ token, new_password: newPassword })
      setSuccess(message)
      window.setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos restablecer tu contraseña.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={isDark ? 'min-h-screen bg-[#0A0D14] px-4 py-12 text-slate-50' : 'min-h-screen bg-slate-100 px-4 py-12 text-slate-900'}>
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-700 bg-slate-950/90 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.6)]">
        <p className={isDark ? 'text-[10px] uppercase tracking-[0.24em] text-slate-400' : 'text-[10px] uppercase tracking-[0.24em] text-slate-500'}>Acceso</p>
        <h1 className={isDark ? 'mt-2 text-3xl font-semibold text-white' : 'mt-2 text-3xl font-semibold text-slate-900'}>Restablecer contraseña</h1>

        {!token ? (
          <div className={isDark ? 'mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200' : 'mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700'}>
            <p>El enlace de recuperación no es válido o ya expiró.</p>
            <button type="button" onClick={() => navigate('/forgot-password')} className={isDark ? 'mt-3 text-emerald-400' : 'mt-3 text-emerald-600'}>
              Solicitar otro enlace
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Nueva contraseña</label>
              <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5' : 'flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5'}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={isDark ? 'w-full bg-transparent text-sm text-white outline-none' : 'w-full bg-transparent text-sm text-slate-900 outline-none'}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Confirmar contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400'}
                placeholder="Repite la contraseña"
                required
              />
            </div>

            {error && (
              <div className={isDark ? 'rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'}>
                {error}
              </div>
            )}

            {success && (
              <div className={isDark ? 'rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200' : 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'}>
                {success}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className={isDark ? 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60' : 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60'}>
              {isSubmitting ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </form>
        )}

        <button type="button" onClick={() => navigate('/login')} className={isDark ? 'mt-5 text-sm text-emerald-400' : 'mt-5 text-sm text-emerald-600'}>
          Ir a iniciar sesión
        </button>
      </div>
    </div>
  )
}

