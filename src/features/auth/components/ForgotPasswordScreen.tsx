import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/useAppStore'

export default function ForgotPasswordScreen() {
  const navigate = useNavigate()
  const { forgotPassword, theme } = useAppStore()
  const isDark = theme === 'dark'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<{ message: string; success: boolean } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)
    setIsSubmitting(true)

    try {
      const message = await forgotPassword(email.trim())
      setStatus({ message, success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos enviar tu enlace de recuperación.'
      setStatus({ message, success: false })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={isDark ? 'min-h-screen bg-[#0A0D14] px-4 py-12 text-slate-50' : 'min-h-screen bg-slate-100 px-4 py-12 text-slate-900'}>
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-700 bg-slate-950/90 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.6)]">
        <p className={isDark ? 'text-[10px] uppercase tracking-[0.24em] text-slate-400' : 'text-[10px] uppercase tracking-[0.24em] text-slate-500'}>Seguridad</p>
        <h1 className={isDark ? 'mt-2 text-3xl font-semibold text-white' : 'mt-2 text-3xl font-semibold text-slate-900'}>¿Olvidaste tu contraseña?</h1>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400'}
              placeholder="tu@correo.com"
              required
            />
          </div>

          {status && (
            <div className={status.success ? (isDark ? 'rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200' : 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700') : (isDark ? 'rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700')}>
              {status.message}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className={isDark ? 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60' : 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60'}>
            {isSubmitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <button type="button" onClick={() => navigate('/login')} className={isDark ? 'mt-5 text-sm text-emerald-400' : 'mt-5 text-sm text-emerald-600'}>
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}

