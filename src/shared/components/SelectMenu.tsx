import { ChevronDown } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const insideButton = containerRef.current?.contains(target)
      const insideMenu = menuRef.current?.contains(target)
      if (!insideButton && !insideMenu) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // El menú se dibuja en un portal con posición fija para que no lo recorten los contenedores
  // con overflow (por ejemplo la tabla con scroll horizontal). Se reposiciona al abrir y se cierra
  // si la página o el contenedor hacen scroll, o si cambia el tamaño de la ventana.
  useLayoutEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuWidth = Math.max(rect.width, 140)
      const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - menuWidth - 8))
      const menuHeight = menuRef.current?.offsetHeight ?? 0
      const fitsBelow = rect.bottom + 4 + menuHeight <= window.innerHeight - 8
      const top = fitsBelow || rect.top - 4 - menuHeight < 8 ? rect.bottom + 4 : rect.top - 4 - menuHeight
      setMenuPosition({ top, left, width: menuWidth })
    }

    const closeOnScroll = (event: Event) => {
      if (menuRef.current && event.target instanceof Node && menuRef.current.contains(event.target)) return
      setIsOpen(false)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
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

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPosition?.top ?? 0, left: menuPosition?.left ?? 0, width: menuPosition?.width, visibility: menuPosition ? 'visible' : 'hidden' }}
          className={cn(
            'scroll-themed z-[100] max-h-60 min-w-[140px] overflow-y-auto rounded-lg border',
            isDark ? 'scroll-themed-dark' : 'scroll-themed-light',
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
        </div>,
        document.body,
      )}
    </div>
  )
}
