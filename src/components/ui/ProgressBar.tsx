import { cn } from '@/lib/cn'

import type { Tone } from './Badge'

const FILLS: Record<Tone | 'accent', string> = {
  accent: 'bg-accent',
  // Paused/neutral: muted ink, still distinguishable from the `track`.
  neutral: 'bg-ink-muted',
  positive: 'bg-positive',
  negative: 'bg-negative',
  warning: 'bg-warning',
}

interface ProgressBarProps {
  /** 0–100; clamped. */
  value: number
  label: string
  tone?: Tone | 'accent'
  size?: 'sm' | 'md'
  className?: string
}

export function ProgressBar({
  value,
  label,
  tone = 'accent',
  size = 'sm',
  className,
}: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      className={cn(
        'overflow-hidden rounded-full bg-track',
        size === 'sm' ? 'h-2' : 'h-3',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-tactile',
          FILLS[tone],
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

/** `current / target` as a 0–100 percentage (see `progressPercent` in lib/goalMath). */
export { progressPercent as progressPercentage } from '@/lib/goalMath'
