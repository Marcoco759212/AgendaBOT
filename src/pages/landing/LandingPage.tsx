import { motion } from 'framer-motion'
import { ArrowRight, Check, MoonStar, ShieldCheck, Sparkles, SunMedium, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../shared/components/button'
import { useAppStore } from '../../store/useAppStore'

const navItems = [
  { id: 'product', label: 'Producto' },
  { id: 'pricing', label: 'Precios' },
  { id: 'clients', label: 'Clientes' },
]

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 29,
    annual: 24,
    description: 'Ideal para negocios en crecimiento.',
    featured: false,
    features: ['1 sucursal', 'WhatsApp + IA', 'Calendario básico', 'Recordatorios automáticos'],
    limits: { conversations: 1000, branches: 1, calendars: 1 },
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 59,
    annual: 47,
    description: 'Para equipos con mayor volumen de citas.',
    featured: true,
    features: ['3 sucursales', 'IA multi-canal', 'Integración Google Calendar', 'Reportes avanzados'],
    limits: { conversations: 1000, branches: 3, calendars: 2 },
  },
  {
    id: 'business',
    name: 'Business',
    monthly: 119,
    annual: 95,
    description: 'Para cadenas y franquicias.',
    featured: false,
    features: ['Sucursales ilimitadas', 'IA personalizada', 'Soporte prioritario', 'Analytics ejecutivo'],
    limits: { conversations: 5000, branches: 99, calendars: 5 },
  },
]

function LandingPage() {
  const navigate = useNavigate()
  const { setBillingCycle, setSelectedPlan, activeBillingCycle, selectedPlanId, setTheme, theme } = useAppStore()
  const isDark = theme === 'dark'
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('product')

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const updateActiveSection = () => {
      const headerOffset = 160
      let currentSection = navItems[0].id
      let closestDistance = Number.POSITIVE_INFINITY

      for (const item of navItems) {
        const section = document.getElementById(item.id)
        if (!section) continue

        const rect = section.getBoundingClientRect()
        const distanceFromHeader = Math.abs(rect.top - headerOffset)

        if (rect.top <= headerOffset && rect.bottom >= headerOffset) {
          currentSection = item.id
          break
        }

        if (distanceFromHeader < closestDistance) {
          closestDistance = distanceFromHeader
          currentSection = item.id
        }
      }

      setActiveSection(currentSection)
    }

    const handleScroll = () => {
      window.requestAnimationFrame(updateActiveSection)
    }

    updateActiveSection()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    setIsSigningUp(true)
    setTimeout(() => {
      navigate('/dashboard')
      setIsSigningUp(false)
    }, 700)
  }

  return (
    <div className={isDark ? 'dark' : 'light'}>
      <div className={isDark ? 'min-h-screen bg-[#0A0D14] text-white' : 'min-h-screen bg-slate-100 text-slate-900'}>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? isDark
              ? 'border-b border-slate-700/80 bg-slate-950/60 shadow-[0_20px_80px_rgba(15,23,42,0.5)] backdrop-blur-xl'
              : 'border-b border-slate-300 bg-white/80 shadow-[0_20px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl'
            : isDark
              ? 'bg-transparent'
              : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-violet-500 font-bold shadow-lg shadow-emerald-500/20">
              A
            </div>
            <div>
              <p className={isDark ? 'text-xs uppercase tracking-[0.22em] text-slate-400' : 'text-xs uppercase tracking-[0.22em] text-slate-500'}>Agenda</p>
              <h2 className={isDark ? 'text-base font-semibold text-white' : 'text-base font-semibold text-slate-900'}>BOT</h2>
            </div>
          </div>

          <div className={isDark ? 'hidden items-center gap-2 rounded-full border border-slate-600/80 bg-slate-900/40 p-1.5 text-sm backdrop-blur-md md:flex' : 'hidden items-center gap-2 rounded-full border border-slate-300 bg-white/80 p-1.5 text-sm shadow-sm md:flex'}>
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`rounded-full px-3 py-2 text-sm transition-all ${
                  activeSection === item.id
                    ? isDark ? 'bg-white text-slate-950 shadow-md' : 'bg-slate-900 text-white shadow-md'
                    : isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={isDark ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-slate-900 text-slate-100 transition hover:bg-slate-800' : 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-slate-700 transition hover:bg-slate-100'}
              aria-label="Toggle theme"
            >
              {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </button>

            <Button variant="secondary" onClick={() => navigate('/dashboard')} className="rounded-xl px-4 py-2 text-sm">
              Iniciar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-8">
        <section id="product" className="scroll-mt-28 grid items-center gap-10 pb-20 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className={isDark ? 'mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-emerald-200' : 'mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-emerald-700'}>
              <Sparkles className="h-3.5 w-3.5" />
              IA + WhatsApp para tu agenda
            </div>

            <h1 className={isDark ? 'max-w-xl text-4xl font-semibold leading-tight text-white md:text-6xl' : 'max-w-xl text-4xl font-semibold leading-tight text-slate-900 md:text-6xl'}>
              Automatiza tus citas con IA en WhatsApp
            </h1>

            <p className={isDark ? 'mt-6 max-w-xl text-lg text-slate-300' : 'mt-6 max-w-xl text-lg text-slate-600'}>
              Gestiona reservas, confirma clientes y sincroniza servicios con un bot inteligente que trabaja 24/7.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="h-12 rounded-2xl px-5 text-sm" onClick={() => navigate('/dashboard')}>
                Comenzar Prueba Gratuita de 14 Días
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="secondary" className="h-12 rounded-2xl px-5 text-sm">
                Ver demo
              </Button>
            </div>

            <div className={isDark ? 'mt-8 flex flex-wrap gap-6 text-sm text-slate-300' : 'mt-8 flex flex-wrap gap-6 text-sm text-slate-600'}>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Filtro de leads</div>
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-violet-300" /> Respuestas en segundos</div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 via-violet-500/10 to-transparent blur-3xl" />
            <div className={isDark ? 'overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900/90 p-4 shadow-2xl' : 'overflow-hidden rounded-[2rem] border border-slate-300 bg-white p-4 shadow-2xl'}>
              <div className={isDark ? 'mb-4 flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/70 p-3' : 'mb-4 flex items-center justify-between rounded-2xl border border-slate-300 bg-slate-50 p-3'}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                </div>
                <span className="text-xs text-slate-400">AgendaBOT AI</span>
              </div>

              <div className={isDark ? 'space-y-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4' : 'space-y-4 rounded-2xl border border-slate-300 bg-slate-50 p-4'}>
                <div className={isDark ? 'rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3 text-sm text-violet-100' : 'rounded-2xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-700'}>
                  Hola, ¿te interesa una cita para limpieza dental?
                </div>
                <div className={isDark ? 'ml-auto max-w-[80%] rounded-2xl bg-emerald-500/15 p-3 text-sm text-emerald-100' : 'ml-auto max-w-[80%] rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700'}>
                  Sí, quiero agendarla para mañana a las 10:00 am.
                </div>
                <div className={isDark ? 'rounded-2xl border border-slate-600 bg-slate-900/80 p-3 text-sm text-slate-200' : 'rounded-2xl border border-slate-300 bg-white p-3 text-sm text-slate-700'}>
                  Perfecto, te dejo disponible: <span className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>10:00 am • 45 min • $1,200 MXN</span>
                </div>
                <div className={isDark ? 'rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-100' : 'rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700'}>
                  Confirmado por WhatsApp y sincronizado con tu calendario.
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="pricing" className="scroll-mt-28 pt-8">
          <div className="mb-8 text-center">
            <p className={isDark ? 'text-xs uppercase tracking-[0.25em] text-slate-400' : 'text-xs uppercase tracking-[0.25em] text-slate-500'}>Planes y precios</p>
            <h2 className={isDark ? 'mt-4 text-3xl font-semibold text-white md:text-4xl' : 'mt-4 text-3xl font-semibold text-slate-900 md:text-4xl'}>Elige la mejor capa para tu negocio</h2>
          </div>

          <div className={isDark ? 'mb-8 flex items-center justify-center gap-3 rounded-full border border-slate-700 bg-slate-900/80 p-1.5' : 'mb-8 flex items-center justify-center gap-3 rounded-full border border-slate-300 bg-white p-1.5 shadow-sm'}>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeBillingCycle === 'monthly' ? (isDark ? 'bg-slate-100 text-slate-950 shadow-sm' : 'bg-slate-900 text-white') : isDark ? 'text-slate-200' : 'text-slate-700'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeBillingCycle === 'annual' ? (isDark ? 'bg-slate-100 text-slate-950 shadow-sm' : 'bg-slate-900 text-white') : isDark ? 'text-slate-200' : 'text-slate-700'}`}
            >
              Anual
              <span className={activeBillingCycle === 'annual' ? (isDark ? 'ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-emerald-700' : 'ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-emerald-700') : isDark ? 'ml-2 rounded-full bg-emerald-500/25 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-emerald-200' : 'ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-emerald-700'}>Ahorra 20%</span>
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id
              const price = activeBillingCycle === 'monthly' ? plan.monthly : plan.annual
              const isFeatured = plan.featured

              return (
                <motion.div
                  key={plan.id}
                  whileHover={{ y: -6 }}
                  className={`flex h-full flex-col rounded-[2rem] border p-6 ${
                    isFeatured
                      ? isDark
                        ? 'border-violet-500/40 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]'
                        : 'border-violet-300 bg-violet-50/80 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]'
                      : isDark
                        ? 'border-slate-700 bg-slate-900/80'
                        : 'border-slate-300 bg-white shadow-sm'
                  }`}
                >
                  {isFeatured && (
                    <div className={isDark ? 'mb-4 inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-violet-200' : 'mb-4 inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-violet-700'}>
                      Más popular
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className={isDark ? 'text-2xl font-semibold text-white' : 'text-2xl font-semibold text-slate-900'}>{plan.name}</h3>
                    <p className={isDark ? 'mt-2 text-sm text-slate-400' : 'mt-2 text-sm text-slate-600'}>{plan.description}</p>

                    <div className="mt-5 flex items-end gap-2">
                      <span className={isDark ? 'text-4xl font-bold text-white' : 'text-4xl font-bold text-slate-900'}>${price}</span>
                      <span className={isDark ? 'pb-1 text-sm text-slate-400' : 'pb-1 text-sm text-slate-500'}>/mes</span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className={isDark ? 'flex items-center gap-3 text-sm text-slate-200' : 'flex items-center gap-3 text-sm text-slate-700'}>
                          <Check className={isDark ? 'h-4 w-4 text-emerald-300' : 'h-4 w-4 text-emerald-500'} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    variant={isFeatured ? 'primary' : 'secondary'}
                    className={`mt-6 w-full rounded-xl ${isSelected ? (isDark ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-100' : 'border-emerald-300 bg-emerald-50 text-emerald-700') : ''}`}
                  >
                    {isSelected ? 'Plan seleccionado' : 'Seleccionar Plan'}
                  </Button>
                </motion.div>
              )
            })}
          </div>

          {isSigningUp && (
            <div className="mt-6 text-center text-sm text-emerald-200">
              Preparando onboarding para tu plan…
            </div>
          )}
        </section>

        <section id="clients" className="scroll-mt-28 pt-20">
          <div className="mb-8 text-center">
            <p className={isDark ? 'text-xs uppercase tracking-[0.25em] text-slate-400' : 'text-xs uppercase tracking-[0.25em] text-slate-500'}>Clientes</p>
            <h2 className={isDark ? 'mt-4 text-3xl font-semibold text-white md:text-4xl' : 'mt-4 text-3xl font-semibold text-slate-900 md:text-4xl'}>Empresas que ya están automatizando su atención</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: 'Clínica Aurora',
                quote: 'Reducimos el 62% del trabajo manual con citas automatizadas y recordatorios inteligentes.',
              },
              {
                name: 'Studio Mía',
                quote: 'La experiencia de WhatsApp y la agendación en tiempo real mejoraron nuestro cierre de ventas.',
              },
              {
                name: 'Nexa Salones',
                quote: 'Ahora cada turno se confirma solo, y la operación de 3 sucursales se mantiene sincronizada.',
              },
            ].map((client) => (
              <div key={client.name} className={isDark ? 'rounded-[1.75rem] border border-slate-700 bg-slate-900/80 p-6' : 'rounded-[1.75rem] border border-slate-300 bg-white p-6 shadow-sm'}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-violet-500 font-semibold text-white">
                    {client.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>{client.name}</p>
                    <p className={isDark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Operación digital</p>
                  </div>
                </div>
                <p className={isDark ? 'text-sm leading-7 text-slate-300' : 'text-sm leading-7 text-slate-600'}>“{client.quote}”</p>
              </div>
            ))}
          </div>
        </section>

        <section id="footer" className="scroll-mt-28 pt-20">
          <div className={isDark ? 'relative overflow-hidden rounded-[2.5rem] border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-[0_30px_100px_rgba(16,185,129,0.15)] md:p-12' : 'relative overflow-hidden rounded-[2.5rem] border border-slate-300 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-12'}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.22),_transparent_38%)]" />
            <div className="absolute right-6 top-6 h-28 w-28 rounded-full border border-emerald-500/30 bg-emerald-500/10 blur-2xl" />
            <div className="absolute bottom-8 left-8 h-32 w-32 rounded-full border border-violet-500/30 bg-violet-500/10 blur-2xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
              <div>
                <div className={isDark ? 'mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-200' : 'mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-700'}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Convierte más citas
                </div>

                <h2 className={isDark ? 'max-w-xl text-4xl font-semibold tracking-tight text-white md:text-5xl' : 'max-w-xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl'}>
                  Deja de perder reservas por falta de respuesta.
                </h2>

                <p className={isDark ? 'mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg' : 'mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg'}>
                  AgendaBOT crea un flujo automatizado que responde, confirma y agenda a clientes en segundos, sin descuidar la experiencia humana ni la operación del negocio.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button className="h-12 rounded-2xl px-5 text-sm" onClick={() => navigate('/dashboard')}>
                    Probar gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="secondary" className="h-12 rounded-2xl px-5 text-sm">
                    Hablar con ventas
                  </Button>
                </div>
              </div>

              <div className={isDark ? 'rounded-[2rem] border border-slate-700 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.7)]' : 'rounded-[2rem] border border-slate-300 bg-slate-50 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]'}>
                <div className={isDark ? 'flex items-center justify-between border-b border-slate-700 pb-4' : 'flex items-center justify-between border-b border-slate-300 pb-4'}>
                  <div>
                    <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Resultado</p>
                    <h3 className={isDark ? 'mt-2 text-3xl font-semibold text-white' : 'mt-2 text-3xl font-semibold text-slate-900'}>+42%</h3>
                  </div>
                  <div className={isDark ? 'rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-200' : 'rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700'}>Aumento</div>
                </div>

                <div className="mt-5 space-y-4">
                  {[
                    'Confirmaciones automáticas en menos de 30 segundos',
                    'Atención 24/7 sin aumentar personal',
                    'Sincronización con WhatsApp y calendario',
                  ].map((item) => (
                    <div key={item} className={isDark ? 'flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-200' : 'flex items-start gap-3 rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700'}>
                      <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <footer className={isDark ? 'mt-10 flex flex-col gap-4 border-t border-slate-700 pt-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between' : 'mt-10 flex flex-col gap-4 border-t border-slate-300 pt-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between'}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-violet-500 font-bold text-white">
                A
              </div>
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>AgendaBOT</span>
            </div>

            <div className={isDark ? 'flex items-center gap-5 text-slate-400' : 'flex items-center gap-5 text-slate-600'}>
              <span>Producto</span>
              <span>Precios</span>
              <span>Clientes</span>
              <Link to="/terminos" className={isDark ? 'transition hover:text-white' : 'transition hover:text-slate-900'}>
                Términos
              </Link>
              <Link to="/privacidad" className={isDark ? 'transition hover:text-white' : 'transition hover:text-slate-900'}>
                Privacidad
              </Link>
            </div>

            <span>© 2026 AgendaBOT</span>
          </footer>
        </section>
      </main>
    </div>
    </div>
  )
}

export default LandingPage
