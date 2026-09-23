import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
  /** Overrides the accessible name when the visible label is an abbreviation. */
  ariaLabel?: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-surface p-1"
    >
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon, ariaLabel }) => {
        const selected = optionValue === value
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={selected}
            aria-label={ariaLabel}
            onClick={() => onChange(optionValue)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
              selected
                ? 'bg-surface-elevated font-medium text-ink shadow-sm ring-1 ring-border'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden />}
            {optionLabel}
          </button>
        )
      })}
    </div>
  )
}
