import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAppStore } from '../../../store/useAppStore'

export default function AccountSecuritySection() {
  const { changePassword, theme } = useAppStore()
  const isDark = theme === 'dark'
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)

    try {
      const message = await changePassword({ current_password: currentPassword, new_password: newPassword })
      setSuccessMessage(message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos cambiar la contraseña.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-5' : 'rounded-2xl border border-slate-300 bg-white p-5 shadow-sm'}>
      <div className="mb-5">
        <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Seguridad</p>
        <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>Contraseña</h2>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <div className="space-y-2 md:col-span-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Contraseña actual</label>
          <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5' : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5'}>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={isDark ? 'w-full bg-transparent text-sm text-white outline-none' : 'w-full bg-transparent text-sm text-slate-900 outline-none'}
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setShowCurrent((current) => !current)} className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Nueva contraseña</label>
          <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5' : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5'}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={isDark ? 'w-full bg-transparent text-sm text-white outline-none' : 'w-full bg-transparent text-sm text-slate-900 outline-none'}
              placeholder="Mínimo 8 caracteres"
              required
            />
            <button type="button" onClick={() => setShowNew((current) => !current)} className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Confirmar contraseña</label>
          <div className={isDark ? 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5' : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5'}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={isDark ? 'w-full bg-transparent text-sm text-white outline-none' : 'w-full bg-transparent text-sm text-slate-900 outline-none'}
              placeholder="Repite la nueva contraseña"
              required
            />
            <button type="button" onClick={() => setShowConfirm((current) => !current)} className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className={isDark ? 'md:col-span-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'}>
            {error}
          </div>
        )}

        {successMessage && (
          <div className={isDark ? 'md:col-span-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200' : 'md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'}>
            {successMessage}
          </div>
        )}

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={isSubmitting} className={isDark ? 'rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60' : 'rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60'}>
            {isSubmitting ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </form>
    </section>
  )
}
