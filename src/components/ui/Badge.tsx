import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type Tone = 'neutral' | 'positive' | 'negative' | 'warning'

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-ink-muted',
  positive: 'bg-positive-soft text-positive',
  negative: 'bg-negative-soft text-negative',
  warning: 'bg-warning-soft text-warning',
}

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  className?: string
}

/** A status word, not decoration. Use sparingly: at most one per row, only when it changes a decision. */
export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-body-sm font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
