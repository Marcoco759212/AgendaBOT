import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

type SelectMenuOption<T extends string> = { value: T; label: string }

interface SelectMenuProps<T extends string> {
  value: T
  options: SelectMenuOption<T>[]
  onChange: (value: T) => void
  isDark: boolean
  disabled?: boolean
  placeholder?: string
}

export default function SelectMenu<T extends string>({ value, options, onChange, isDark, disabled, placeholder }: SelectMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          isDark ? 'border-slate-700 bg-slate-950/80 text-white hover:border-slate-600' : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300',
        )}
      >
        <span className={cn('truncate', !selected && (isDark ? 'text-slate-400' : 'text-slate-500'))}>{selected?.label ?? placeholder ?? value}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0', isDark ? 'text-slate-400' : 'text-slate-500')} />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-30 mt-1 max-h-60 w-full min-w-[140px] overflow-y-auto rounded-lg border',
            isDark ? 'border-slate-700 bg-slate-900 shadow-[0_18px_35px_rgba(2,6,23,0.55)]' : 'border-slate-200 bg-white shadow-[0_18px_35px_rgba(15,23,42,0.12)]',
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={cn(
                'block w-full px-3 py-2 text-left text-xs font-medium transition-colors',
                option.value === value
                  ? isDark ? 'bg-violet-500/15 text-violet-200' : 'bg-emerald-50 text-emerald-700'
                  : isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
