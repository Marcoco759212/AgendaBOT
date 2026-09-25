import { motion } from 'framer-motion'
import { Bot, CalendarCheck2, Sparkles, TimerReset } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'

interface RecentActivityProps {
  items?: Array<{ id: string; message: string; time: string; type: 'success' | 'ai' | 'pending' | 'sync' }>
}

const activityIcons = {
  success: CalendarCheck2,
  ai: Sparkles,
  pending: TimerReset,
  sync: Bot,
}

function RecentActivity({ items = [] }: RecentActivityProps) {
  const { theme } = useAppStore()
  const isDark = theme === 'dark'

  return (
    <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-4' : 'rounded-2xl border border-slate-300 bg-white p-4 shadow-sm'}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Actividad</p>
          <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900'}>IA en tiempo real</h3>
        </div>
        <button className={isDark ? 'rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-300' : 'rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-600'}>Live</button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = activityIcons[item.type as keyof typeof activityIcons]
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className={isDark ? 'flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3' : 'flex items-start gap-3 rounded-xl border border-slate-300 bg-slate-50 p-3'}
            >
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-200">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={isDark ? 'text-sm text-slate-200' : 'text-sm text-slate-700'}>{item.message}</p>
                <p className={isDark ? 'mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500' : 'mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500'}>{item.time}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default RecentActivity
