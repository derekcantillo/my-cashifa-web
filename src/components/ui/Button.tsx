import type { LucideIcon } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'link'
export type ButtonSize = 'sm' | 'md'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink shadow-raised hover:bg-accent-hover',
  secondary: 'bg-surface-raised text-ink shadow-raised hover:bg-surface',
  ghost: 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
  /** Confirms a destructive action (the last step of a delete). */
  danger: 'bg-negative text-negative-ink shadow-raised hover:bg-negative-hover',
  /** Starts a destructive action ("Eliminar" in a form footer). */
  'danger-ghost': 'text-negative hover:bg-negative-soft',
  /**
   * Inline action in accent text with no box and no horizontal padding, so its text
   * lines up with the text around it ("Ver metas →").
   */
  link: 'cursor-pointer text-accent underline-offset-4 hover:underline',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3.5 text-body-sm',
  md: 'h-10 gap-2 px-4 text-body',
}

/** `link` keeps a 36px target height but no horizontal padding. */
const LINK_SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 gap-1 px-0 text-body-sm',
  md: 'min-h-10 gap-1.5 px-0 text-body',
}

interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
}

/** Button look for elements that aren't buttons (e.g. a router `<Link>`). */
export function buttonClassName({ variant = 'primary', size = 'md' }: ButtonStyleOptions = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap select-none',
    'transition-tactile',
    variant !== 'link' && 'press-tactile',
    'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
    VARIANTS[variant],
    variant === 'link' ? LINK_SIZES[size] : SIZES[size],
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {
  /** Shows a spinner, keeps the label (no layout jump) and blocks clicks. */
  loading?: boolean
  icon?: LucideIcon
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    loading = false,
    icon: Icon,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClassName({ variant, size }), className)}
      {...props}
    >
      {loading ? <Spinner /> : Icon && <Icon aria-hidden className="size-4" />}
      {children}
    </button>
  )
})
