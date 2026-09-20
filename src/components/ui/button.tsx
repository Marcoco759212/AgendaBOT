import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 disabled:pointer-events-none disabled:opacity-50',
        {
          'border-emerald-600 bg-emerald-600 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.25)] hover:bg-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100 dark:hover:bg-emerald-500/20': variant === 'primary',
          'border-amber-300 bg-amber-50 text-amber-800 shadow-[0_0_0_1px_rgba(251,191,36,0.18)] hover:bg-amber-100 dark:border-amber-300/80 dark:bg-amber-400/20 dark:text-amber-50 dark:hover:bg-amber-400/30': variant === 'secondary',
          'border-transparent bg-transparent text-slate-700 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/70': variant === 'ghost',
        },
        {
          'h-8 px-3 text-xs': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-11 px-5 text-base': size === 'lg',
        },
        className,
      )}
      {...props}
    />
  )
}
