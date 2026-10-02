import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

import type { Tone } from './Badge'
import { ProgressBar } from './ProgressBar'

interface HeroProgressProps {
  /** 0–100; clamped. */
  value: number
  /** Accessible name of the bar. */
  label: string
  /** Line under the bar ("Gastado $X de $Y"). */
  caption: ReactNode
  tone?: Tone | 'accent'
  className?: string
}

/**
 * The bar under a screen's hero figure (Home, Goals): full width of the content
 * column — the same as the stats strip below it — thin, with its caption underneath.
 */
export function HeroProgress({ value, label, caption, tone, className }: HeroProgressProps) {
  return (
    <div className={cn('w-full space-y-2', className)}>
      <ProgressBar value={value} label={label} tone={tone} className="h-1.5" />
      <p className="text-body-sm text-ink-muted tabular-nums">{caption}</p>
    </div>
  )
}

/** Same footprint while the data loads. */
export function HeroProgressSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('w-full space-y-2', className)}>
      <div className="h-1.5 w-full animate-pulse rounded-full bg-surface-sunken" />
      <div className="h-3 w-44 animate-pulse rounded-sm bg-surface-sunken" />
    </div>
  )
}
