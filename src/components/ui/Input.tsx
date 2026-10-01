import { Search, X } from 'lucide-react'
import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

/** Carved-in field: sunken surface, rises to `surface-raised` while focused. */
export function fieldClassName(invalid = false) {
  return cn(
    'h-10 w-full min-w-0 rounded-sm bg-surface-sunken px-3 text-body text-ink shadow-pressed',
    'placeholder:text-ink-subtle transition-tactile',
    'focus:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    invalid
      ? 'outline-2 -outline-offset-2 outline-negative focus-visible:outline-negative'
      : 'focus-visible:outline-accent',
  )
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
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
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
          className="absolute top-1/2 right-1 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-ink-subtle transition-tactile hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  )
})
