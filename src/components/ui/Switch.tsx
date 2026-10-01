import { cn } from '@/lib/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible name. Rendered next to the track unless `hideLabel`. */
  label: string
  hideLabel?: boolean
  disabled?: boolean
  className?: string
}

export function Switch({
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'group inline-flex min-h-9 items-center gap-3 rounded-sm text-body text-ink',
        'disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 shadow-pressed transition-tactile',
          checked ? 'bg-accent' : 'bg-surface-sunken',
        )}
      >
        <span
          className={cn(
            'size-5 rounded-full bg-surface-raised shadow-raised transition-tactile',
            checked && 'translate-x-4',
          )}
        />
      </span>
      {!hideLabel && <span>{label}</span>}
    </button>
  )
}
