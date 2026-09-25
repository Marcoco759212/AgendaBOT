import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/useAppStore'

export default function AuthScreen({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const navigate = useNavigate()
  const { login, register, theme, setTheme, isAuthenticated, isSessionReady, restoreSession } = useAppStore()
  const isDark = theme === 'dark'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  useEffect(() => {
    if (isSessionReady && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isSessionReady, navigate])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await register({
          email: email.trim(),
          password,
          nombre_negocio: nombreNegocio.trim(),
          nombre_usuario: nombreUsuario.trim(),
        })
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos completar la solicitud.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isSessionReady) {
    return (
      <div className={isDark ? 'flex min-h-screen items-center justify-center bg-[#0A0D14] text-white' : 'flex min-h-screen items-center justify-center bg-slate-100 text-slate-900'}>
        <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Cargando sesión…</div>
      </div>
    )
  }

  return (
    <div className={isDark ? 'min-h-screen bg-[#0A0D14] text-slate-50' : 'min-h-screen bg-slate-100 text-slate-900'}>
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12">
        <div className={isDark ? 'grid w-full overflow-hidden rounded-[2rem] border border-slate-700/80 bg-slate-950/90 shadow-[0_30px_100px_rgba(15,23,42,0.6)] lg:grid-cols-[1.1fr_0.9fr]' : 'grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_0.9fr]'}>
          <div className={isDark ? 'relative hidden overflow-hidden border-r border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,#0B1120_0%,#111827_50%,#0F172A_100%)] p-10 lg:block' : 'relative hidden overflow-hidden border-r border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_30%,#f8fafc_100%)] p-10 lg:block'}>
            <div className="relative z-10 max-w-md">
              <div className={isDark ? 'mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-emerald-200' : 'mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-emerald-700'}>
                AgendaBOT
              </div>
              <h1 className={isDark ? 'text-4xl font-semibold text-white' : 'text-4xl font-semibold text-slate-900'}>Automatiza tu negocio con IA.</h1>
              <p className={isDark ? 'mt-5 text-base leading-7 text-slate-300' : 'mt-5 text-base leading-7 text-slate-600'}>
                Gestiona citas, confirma disponibilidad y responde clientes desde una sola plataforma.
              </p>
              <div className="mt-8 grid gap-4 text-sm">
                {['Agenda inteligente', 'Recordatorios automáticos', 'WhatsApp + Google Calendar'].map((feature) => (
                  <div key={feature} className={isDark ? 'flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-3 text-slate-200' : 'flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-slate-700'}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">✓</div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-md">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className={isDark ? 'text-[10px] uppercase tracking-[0.24em] text-slate-400' : 'text-[10px] uppercase tracking-[0.24em] text-slate-500'}>Acceso</p>
                  <h2 className={isDark ? 'mt-2 text-3xl font-semibold text-white' : 'mt-2 text-3xl font-semibold text-slate-900'}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={isDark ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200' : 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700'}
                  aria-label="Toggle theme"
                  type="button"
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
              </div>

              <div className={isDark ? 'mb-6 flex rounded-full border border-slate-700 bg-slate-900/80 p-1' : 'mb-6 flex rounded-full border border-slate-300 bg-white p-1 shadow-sm'}>
                {(['login', 'register'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setError('')
                      navigate(option === 'login' ? '/login' : '/register', { replace: true })
                    }}
                    className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${mode === option ? (isDark ? 'bg-slate-100 text-slate-950' : 'bg-slate-900 text-white') : isDark ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    {option === 'login' ? 'Login' : 'Registro'}
                  </button>
                ))}
              </div>

              <form className="space-y-4" onSubmit={submit}>
                {mode === 'register' && (
                  <>
                    <div>
                      <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Nombre del negocio</label>
                      <input value={nombreNegocio} onChange={(event) => setNombreNegocio(event.target.value)} className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400'} placeholder="Mi negocio" required />
                    </div>
                    <div>
                      <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Tu nombre</label>
                      <input value={nombreUsuario} onChange={(event) => setNombreUsuario(event.target.value)} className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400'} placeholder="Ana García" required />
                    </div>
                  </>
                )}

                <div>
                  <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Correo</label>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400'} placeholder="dueno@negocio.com" required />
                </div>

                <div>
                  <label className={isDark ? 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400' : 'mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500'}>Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 pr-11 text-sm text-white placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400'}
                      placeholder="••••••••"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((current) => !current)}
                      className={isDark ? 'absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-slate-300 transition hover:text-white' : 'absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-slate-500 transition hover:text-slate-800'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className={isDark ? 'rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200' : 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className={isDark ? 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60' : 'w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60'}>
                  {isSubmitting ? 'Procesando…' : mode === 'login' ? 'Entrar al panel' : 'Crear negocio'}
                </button>
              </form>

              <div className="mt-5 space-y-3 text-center text-sm">
                {mode === 'login' && (
                  <button type="button" className={isDark ? 'text-emerald-400 underline-offset-4 hover:underline' : 'text-emerald-600 underline-offset-4 hover:underline'} onClick={() => navigate('/forgot-password', { replace: true })}>
                    ¿Olvidaste tu contraseña?
                  </button>
                )}

                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                  <button type="button" className={isDark ? 'font-medium text-emerald-400 underline-offset-4 hover:underline' : 'font-medium text-emerald-600 underline-offset-4 hover:underline'} onClick={() => navigate(mode === 'login' ? '/register' : '/login', { replace: true })}>
                    {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

