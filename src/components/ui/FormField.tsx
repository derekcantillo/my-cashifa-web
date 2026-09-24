import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function inputClassName(error: string | null | undefined) {
  return cn(
    'w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none transition',
    'focus:ring-2 focus:ring-brand/30',
    error ? 'border-danger focus:border-danger' : 'border-border focus:border-brand',
  )
}

interface FieldProps {
  id: string
  label: string
  hint?: string
  /** Rendered below the control with id `${id}-error` — point `aria-describedby` at it. */
  error?: string | null
  children: ReactNode
}

export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {hint && <span className="ml-1 font-normal text-ink-muted">({hint})</span>}
      </label>
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  )
}

export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  )
}

/** Props that wire an input to its `Field` error for assistive tech. */
export function errorProps(id: string, error: string | null | undefined) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  } as const
}
