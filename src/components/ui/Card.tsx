import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

export type CardVariant = 'flat' | 'raised' | 'floating' | 'inset'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const VARIANTS: Record<CardVariant, string> = {
  /** Same plane as the page, outlined by a hairline. */
  flat: 'bg-surface border border-line',
  /** The default content surface. */
  raised: 'bg-surface-raised shadow-raised',
  /** Above everything else: popovers, menus, the one card that matters. */
  floating: 'bg-surface-raised shadow-floating',
  /** Carved into the page: wells, tracks, secondary groups. */
  inset: 'bg-surface-sunken shadow-pressed',
}

const PADDINGS: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

/**
 * For a whole card that is a link or button (`<Link className={interactiveCardClassName}>`):
 * lifts to `floating` on hover, sinks on press. Pair with `raised` styles.
 */
export const interactiveCardClassName = cn(
  'block rounded-card bg-surface-raised text-ink shadow-raised',
  'transition-tactile press-tactile hover:-translate-y-px hover:shadow-floating',
)

interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant
  padding?: CardPadding
  as?: 'div' | 'section' | 'article' | 'aside' | 'li'
}

/** Elevation, not color, sets the hierarchy: pick the variant by how close it is to the user. */
export function Card({
  variant = 'raised',
  padding = 'md',
  as: Element = 'div',
  className,
  ...props
}: CardProps) {
  return (
    <Element
      className={cn('rounded-card text-ink', VARIANTS[variant], PADDINGS[padding], className)}
      {...props}
    />
  )
}
