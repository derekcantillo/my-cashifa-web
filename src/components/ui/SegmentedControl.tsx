import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
  /** Overrides the accessible name when the visible label is an abbreviation. */
  ariaLabel?: string
  /** Muted count after the label ("Gastos 12"). */
  count?: number
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
  /** `sm` is the compact variant (sidebar, toolbars). */
  size?: 'sm' | 'md'
  /** Show only the icons; labels become the accessible names and tooltips. */
  iconOnly?: boolean
  className?: string
}

/** A carved track with the selected option raised out of it. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  size = 'md',
  iconOnly = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'grid auto-cols-fr grid-flow-col gap-0.5 rounded-md bg-surface-sunken p-0.5 shadow-pressed',
        className,
      )}
    >
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon, ariaLabel, count }) => {
        const selected = optionValue === value
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={selected}
            aria-label={iconOnly ? (ariaLabel ?? optionLabel) : ariaLabel}
            title={iconOnly ? optionLabel : undefined}
            onClick={() => onChange(optionValue)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-[calc(var(--radius-md)-2px)] font-medium transition-tactile',
              size === 'sm' ? 'h-8 px-2 text-body-sm' : 'h-9 px-3 text-body',
              selected
                ? 'bg-surface-raised text-ink shadow-raised'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden />}
            {!iconOnly && optionLabel}
            {!iconOnly && count !== undefined && (
              <span className="font-normal text-ink-muted tabular-nums">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
