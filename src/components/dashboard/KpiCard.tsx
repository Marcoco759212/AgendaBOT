import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { AnalyticsKpi } from '../../types'

const accentClasses = {
  emerald: {
    dark: {
      ring: 'from-emerald-500/35 via-emerald-500/15 to-transparent',
      badge: 'bg-emerald-500/15 text-emerald-300',
      value: 'text-emerald-300',
    },
    light: {
      ring: 'from-emerald-500/25 via-emerald-500/10 to-transparent',
      badge: 'bg-emerald-100 text-emerald-700',
      value: 'text-emerald-600',
    },
  },
  violet: {
    dark: {
      ring: 'from-violet-500/35 via-violet-500/15 to-transparent',
      badge: 'bg-violet-500/15 text-violet-200',
      value: 'text-violet-200',
    },
    light: {
      ring: 'from-violet-500/25 via-violet-500/10 to-transparent',
      badge: 'bg-violet-100 text-violet-700',
      value: 'text-violet-600',
    },
  },
  amber: {
    dark: {
      ring: 'from-amber-500/35 via-amber-500/15 to-transparent',
      badge: 'bg-amber-500/15 text-amber-200',
      value: 'text-amber-200',
    },
    light: {
      ring: 'from-amber-500/25 via-amber-500/10 to-transparent',
      badge: 'bg-amber-100 text-amber-700',
      value: 'text-amber-600',
    },
  },
  rose: {
    dark: {
      ring: 'from-rose-500/45 via-rose-400/25 to-transparent',
      badge: 'bg-rose-500/20 text-rose-300',
      value: 'text-rose-300',
    },
    light: {
      ring: 'from-rose-500/30 via-rose-400/15 to-transparent',
      badge: 'bg-rose-100 text-rose-600',
      value: 'text-rose-600',
    },
  },
}

function KpiCard({ item }: { item: AnalyticsKpi }) {
  const { theme } = useAppStore()
  const isDark = theme === 'dark'
  const colors = accentClasses[item.accent][isDark ? 'dark' : 'light']
  const DeltaIcon = item.positive ? ArrowUpRight : ArrowDownRight

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className={isDark ? 'group relative flex h-full min-h-[150px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:min-h-[160px] md:p-4 xl:min-h-[170px]' : 'group relative flex h-full min-h-[150px] flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white p-3.5 shadow-sm md:min-h-[160px] md:p-4 xl:min-h-[170px]'}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.ring} opacity-80`} />
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex flex-1 flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={isDark ? 'text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-[11px] md:text-[11px] xl:text-[12px]' : 'text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:text-[11px] md:text-[11px] xl:text-[12px]'}>{item.label}</p>
          </div>
          <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold sm:text-[11px] md:text-[11px] xl:text-[12px] ${colors.badge}`}>
            <DeltaIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {item.delta}
          </div>
        </div>

        <div className="mt-auto">
          <h3 className={isDark ? 'text-[2rem] font-semibold leading-none tracking-[-0.05em] text-white sm:text-[2.3rem] md:text-[2.6rem] xl:text-[3rem]' : 'text-[2rem] font-semibold leading-none tracking-[-0.05em] text-slate-900 sm:text-[2.3rem] md:text-[2.6rem] xl:text-[3rem]'}>{item.value}</h3>
        </div>
      </div>

      <div className={isDark ? 'relative mt-5 flex items-center justify-between gap-3 text-[10px] text-slate-400 sm:text-[11px] md:text-[11px] xl:text-[12px]' : 'relative mt-5 flex items-center justify-between gap-3 text-[10px] text-slate-500 sm:text-[11px] md:text-[11px] xl:text-[12px]'}>
        <span className="whitespace-nowrap">vs. mes anterior</span>
        <span className={`${colors.value} whitespace-nowrap font-semibold`}>{item.positive ? 'Positivo' : 'Revisión'}</span>
      </div>
    </motion.div>
  )
}

export default KpiCard
