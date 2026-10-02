import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

import { fieldBaseClassName } from './Input'

/**
 * @deprecated Legacy class for raw `<input>`/`<select>`/`<textarea>` in screens not yet
 * migrated (goals, loans, settings). New code uses `Input`, `Select`, `Textarea`,
 * `DateInput` or `AmountField`.
 */
export function inputClassName(error: string | null | undefined) {
  return cn(fieldBaseClassName(Boolean(error)), 'min-h-10 px-3 py-2')
}

interface FieldProps {
  id: string
  label: string
  /**
   * Short qualifier after the label, e.g. "opcional" → "Nota (opcional)".
   * Prefer `optional` + `optionalLabel`; kept for the screens not yet migrated.
   */
  hint?: string
  /** Help text under the control (`${id}-help`; add it to `aria-describedby`). */
  help?: ReactNode
  /** Rendered below the control with id `${id}-error` — point `aria-describedby` at it. */
  error?: string | null
  /** Visually hidden label (the control still has an accessible name). */
  hideLabel?: boolean
  className?: string
  children: ReactNode
}

export function Field({
  id,
  label,
  hint,
  help,
  error,
  hideLabel,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className={cn('block text-body-sm font-medium text-ink', hideLabel && 'sr-only')}
      >
        {label}
        {hint && <span className="ml-1 font-normal text-ink-subtle">({hint})</span>}
      </label>
      {children}
      {help && !error && (
        <div id={`${id}-help`} className="text-body-sm text-ink-muted">
          {help}
        </div>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  )
}

export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="text-body-sm text-negative">
      {children}
    </p>
  )
}

/**
 * Props that wire a control to its `Field` error (and help text) for assistive tech.
 * Pass `withHelp` when the field renders `help`.
 */
export function errorProps(id: string, error: string | null | undefined, withHelp = false) {
  const describedBy = [error ? `${id}-error` : null, withHelp && !error ? `${id}-help` : null]
    .filter(Boolean)
    .join(' ')
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  } as const
}
