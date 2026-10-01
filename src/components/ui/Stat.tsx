import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

import { Eyebrow } from './Eyebrow'

interface StatProps {
  label: string
  /** Usually an `<Amount>`; any node with the figure. */
  value: ReactNode
  /** Supporting line under the figure ("de $ 2.400.000 presupuestados"). */
  hint?: ReactNode
  /** `serif` only for the one hero figure of a screen. */
  font?: 'sans' | 'serif'
  className?: string
}

export function Stat({ label, value, hint, font = 'sans', className }: StatProps) {
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <Eyebrow>{label}</Eyebrow>
      <div
        className={cn(
          'text-ink',
          font === 'serif' ? 'font-serif text-display-md' : 'text-title font-semibold tabular-nums',
        )}
      >
        {value}
      </div>
      {hint && <div className="text-body-sm text-ink-muted">{hint}</div>}
    </div>
  )
}
