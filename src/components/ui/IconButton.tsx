import type { LucideIcon } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

export type IconButtonVariant = 'ghost' | 'secondary'
export type IconButtonSize = 'sm' | 'md'

interface IconButtonStyleOptions {
  variant?: IconButtonVariant
  size?: IconButtonSize
}

/** Icon-button look for elements that aren't buttons (e.g. a router `<Link>`). */
export function iconButtonClassName({
  variant = 'ghost',
  size = 'md',
}: IconButtonStyleOptions = {}) {
  return cn(
    'relative inline-flex shrink-0 items-center justify-center rounded-md',
    'transition-tactile press-tactile',
    'disabled:pointer-events-none disabled:opacity-35',
    size === 'sm' ? 'size-9' : 'size-10',
    variant === 'ghost'
      ? 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
      : 'bg-surface-raised text-ink shadow-raised hover:bg-surface',
  )
}

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>, IconButtonStyleOptions {
  /** Accessible name — the button has no visible text. */
  label: string
  icon: LucideIcon
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon: Icon, variant, size, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(iconButtonClassName({ variant, size }), className)}
      {...props}
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  )
})
