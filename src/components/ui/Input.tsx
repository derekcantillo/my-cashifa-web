import { CalendarDays, ChevronDown, Search, X } from 'lucide-react'
import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

import { cn } from '@/lib/cn'

/**
 * Shared look of every text field: a carved-in, sunken surface that rises to
 * `surface-raised` while focused. Height and padding are added per control.
 * Placeholders use `ink-muted`: `ink-subtle` is under 4.5:1 on `surface-sunken`.
 */
export function fieldBaseClassName(invalid = false) {
  return cn(
    'w-full min-w-0 rounded-sm bg-surface-sunken text-body text-ink shadow-pressed',
    'placeholder:text-ink-muted transition-tactile',
    'focus:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    invalid
      ? 'outline-2 -outline-offset-2 outline-negative focus-visible:outline-negative'
      : 'focus-visible:outline-accent',
  )
}

/** Single-line field: 40px tall. */
export function fieldClassName(invalid = false) {
  return cn(fieldBaseClassName(invalid), 'h-10 px-3')
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Error styling + `aria-invalid`. Pair with a visible message (`aria-describedby`). */
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(fieldClassName(invalid), className)}
      {...props}
    />
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, rows = 2, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(fieldBaseClassName(invalid), 'resize-none px-3 py-2.5', className)}
      {...props}
    />
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
  /** Class of the wrapper (width, grid placement). */
  className?: string
}

/** Native `<select>` (keyboard, screen readers and mobile pickers for free) with our chevron. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, className, children, ...props },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(fieldClassName(invalid), 'cursor-pointer appearance-none truncate pr-9')}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  )
})

interface DateInputProps extends Omit<InputProps, 'type'> {
  /** Class of the wrapper. */
  className?: string
}

/**
 * Native `<input type="date">` (its value is always `YYYY-MM-DD`) with our calendar
 * icon. The browser's picker indicator is kept but made transparent and stretched
 * over the icon, so clicking the icon still opens the native picker.
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { invalid = false, className, ...props },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      <input
        ref={ref}
        type="date"
        aria-invalid={invalid || undefined}
        className={cn(
          fieldClassName(invalid),
          'relative pr-10 tabular-nums [color-scheme:inherit]',
          '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0',
          '[&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-10',
          '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
        )}
        {...props}
      />
      <CalendarDays
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  )
})

interface SearchInputProps extends Omit<InputProps, 'type'> {
  /** Accessible name — search fields usually have no visible label. */
  label: string
  /** Shows a clear button while there is text. */
  onClear?: () => void
  clearLabel?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { label, onClear, clearLabel, value, className, ...props },
  ref,
) {
  const hasValue = typeof value === 'string' ? value.length > 0 : value !== undefined
  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
      />
      <Input
        ref={ref}
        type="search"
        aria-label={label}
        value={value}
        className={cn('pl-9 [&::-webkit-search-cancel-button]:appearance-none', onClear && 'pr-10')}
        {...props}
      />
      {onClear && hasValue && (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel ?? label}
          className="absolute top-1/2 right-1 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-ink-muted transition-tactile hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  )
})
