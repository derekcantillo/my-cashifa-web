import { cn } from '@/lib/utils'

interface ProgressBarProps {
  /** 0–100; clamped. */
  value: number
  label: string
  className?: string
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      className={cn('h-2 overflow-hidden rounded-full bg-ink/10', className)}
    >
      <div className="h-full rounded-full bg-brand" style={{ width: `${percentage}%` }} />
    </div>
  )
}

/** `currentAmount / targetAmount` as a 0–100 percentage. */
export function progressPercentage(current: number, target: number): number {
  return target > 0 ? Math.min(100, (current / target) * 100) : 0
}
