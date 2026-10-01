import { cn } from '@/lib/cn'

import type { Tone } from './Badge'

const FILLS: Record<Tone | 'accent', string> = {
  accent: 'bg-accent',
  neutral: 'bg-ink-subtle',
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
        'overflow-hidden rounded-full bg-surface-sunken shadow-pressed',
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

/** `currentAmount / targetAmount` as a 0–100 percentage. */
export function progressPercentage(current: number, target: number): number {
  return target > 0 ? Math.min(100, (current / target) * 100) : 0
}
