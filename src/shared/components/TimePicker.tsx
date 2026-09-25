import { Clock3 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  isDark: boolean
}

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

export default function TimePicker({ value, onChange, isDark }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hour, minute] = value ? value.split(':') : ['', '']

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

  const setHour = (nextHour: string) => onChange(`${nextHour}:${minute || '00'}`)
  const setMinute = (nextMinute: string) => onChange(`${hour || '00'}:${nextMinute}`)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors',
          isDark ? 'border-slate-600 bg-slate-900/80 text-white hover:border-slate-500' : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400',
        )}
      >
        <Clock3 className={cn('h-4 w-4 shrink-0', isDark ? 'text-slate-400' : 'text-slate-500')} />
        <span className="truncate">{value || 'Selecciona una hora'}</span>
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-2xl border shadow-lg',
            isDark ? 'border-slate-700 bg-slate-900 shadow-[0_18px_35px_rgba(2,6,23,0.55)]' : 'border-slate-200 bg-white shadow-[0_18px_35px_rgba(15,23,42,0.12)]',
          )}
        >
          <div className={cn('grid grid-cols-2 divide-x', isDark ? 'divide-slate-700' : 'divide-slate-200')}>
            <div className="max-h-48 overflow-y-auto p-1">
              {HOURS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setHour(option)}
                  className={cn(
                    'block w-full rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors',
                    option === hour
                      ? isDark ? 'bg-violet-500/15 text-violet-200' : 'bg-emerald-50 text-emerald-700'
                      : isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {MINUTES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMinute(option)}
                  className={cn(
                    'block w-full rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors',
                    option === minute
                      ? isDark ? 'bg-violet-500/15 text-violet-200' : 'bg-emerald-50 text-emerald-700'
                      : isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className={cn('flex justify-end border-t p-2', isDark ? 'border-slate-700' : 'border-slate-200')}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={isDark ? 'rounded-lg px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-300 hover:bg-slate-800' : 'rounded-lg px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600 hover:bg-slate-100'}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
