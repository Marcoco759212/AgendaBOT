import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppStore } from '../../../store/useAppStore'

interface AnalyticsChartsProps {
  data?: Array<{ day: string; bookings: number }>
  hourlyDemand?: Array<{ hour: string; demand: number }>
  serviceMix?: Array<{ name: string; value: number; color: string }>
}

function AnalyticsCharts({ data = [], hourlyDemand = [], serviceMix = [] }: AnalyticsChartsProps) {
  const { theme } = useAppStore()
  const isDark = theme === 'dark'

  return (
    <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
      <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-4' : 'rounded-2xl border border-slate-300 bg-white p-4 shadow-sm'}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Reservas</p>
            <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900'}>Flujo de citas por semana</h3>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="bookingFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="bookingFill2" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="bookings" stroke="#10B981" fill="url(#bookingFill)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-4' : 'rounded-2xl border border-slate-300 bg-white p-4 shadow-sm'}>
        <div className="mb-4">
          <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Servicios</p>
          <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900'}>Mix más solicitado</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={serviceMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {serviceMix.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={isDark ? { backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px', color: '#fff' } : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-2">
          {serviceMix.map((item) => (
            <div key={item.name} className={isDark ? 'flex items-center justify-between text-sm text-slate-300' : 'flex items-center justify-between text-sm text-slate-600'}>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </div>
              <span>{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-900/80 p-4 xl:col-span-2' : 'rounded-2xl border border-slate-300 bg-white p-4 shadow-sm xl:col-span-2'}>
        <div className="mb-4">
          <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Demanda</p>
          <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900'}>Horarios con mayor reservación</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyDemand}>
              <CartesianGrid stroke={isDark ? '#334155' : '#cbd5e1'} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" stroke={isDark ? '#94a3b8' : '#475569'} fontSize={12} />
              <YAxis stroke={isDark ? '#94a3b8' : '#475569'} fontSize={12} />
              <Tooltip
                cursor={isDark ? { fill: 'rgba(148, 163, 184, 0.18)', stroke: 'transparent' } : { fill: 'rgba(148, 163, 184, 0.22)', stroke: 'transparent' }}
                contentStyle={isDark ? { backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px', color: '#fff' } : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }}
              />
              <Bar dataKey="demand" radius={[8, 8, 0, 0]} fill={isDark ? '#8B5CF6' : '#7c3aed'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsCharts
