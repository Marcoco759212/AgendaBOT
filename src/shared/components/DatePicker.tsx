import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  isDark: boolean
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateKey = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getMonthCells = (viewDate: Date) => {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<{ date: Date; inCurrentMonth: boolean }> = []

  for (let i = startOffset; i > 0; i--) {
    cells.push({ date: new Date(year, month, 1 - i), inCurrentMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inCurrentMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inCurrentMonth: false })
  }

  return cells
}

export default function DatePicker({ value, onChange, isDark }: DatePickerProps) {
  const selectedDate = value ? parseDateKey(value) : null
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const today = toDateKey(new Date())

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const label = selectedDate
    ? selectedDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Selecciona una fecha'

  const monthLabel = viewDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setViewDate(selectedDate ?? new Date())
          setIsOpen((open) => !open)
        }}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors',
          isDark ? 'border-slate-600 bg-slate-900/80 text-white hover:border-slate-500' : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400',
        )}
      >
        <CalendarDays className={cn('h-4 w-4 shrink-0', isDark ? 'text-slate-400' : 'text-slate-500')} />
        <span className="truncate capitalize">{label}</span>
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border p-3 shadow-lg',
            isDark ? 'border-slate-700 bg-slate-900 shadow-[0_18px_35px_rgba(2,6,23,0.55)]' : 'border-slate-200 bg-white shadow-[0_18px_35px_rgba(15,23,42,0.12)]',
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className={cn('rounded-lg border p-1.5 transition-colors', isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className={cn('text-sm font-medium capitalize', isDark ? 'text-white' : 'text-slate-900')}>{monthLabel}</span>
            <button
              type="button"
              onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className={cn('rounded-lg border p-1.5 transition-colors', isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className={cn('mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide', isDark ? 'text-slate-500' : 'text-slate-400')}>
            {WEEKDAY_LABELS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getMonthCells(viewDate).map(({ date, inCurrentMonth }) => {
              const dateKey = toDateKey(date)
              const isSelected = dateKey === value
              const isToday = dateKey === today

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => {
                    onChange(dateKey)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex h-8 items-center justify-center rounded-lg border border-transparent text-xs transition-colors',
                    !inCurrentMonth && 'opacity-40',
                    isSelected
                      ? isDark ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800'
                      : isToday
                        ? isDark ? 'border-violet-400/50 text-violet-200' : 'border-violet-400/60 text-violet-800'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
