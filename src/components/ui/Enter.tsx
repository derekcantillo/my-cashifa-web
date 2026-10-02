import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/cn'

/** Delay between consecutive blocks of a page entrance (never more than 40ms). */
const STAGGER_MS = 40

interface EnterProps {
  /** Position in the entrance sequence: 0 plays first. */
  order: number
  className?: string
  children: ReactNode
}

/**
 * Fades a page block in (6px rise), `order` steps after the first. Keep the wrapper
 * mounted while its content goes from skeleton to data so it only plays on the page's
 * first mount. Skipped entirely with `prefers-reduced-motion`.
 */
export function Enter({ order, className, children }: EnterProps) {
  const style: CSSProperties = { animationDelay: `${order * STAGGER_MS}ms` }
  return (
    <div className={cn('motion-safe:animate-enter', className)} style={style}>
      {children}
    </div>
  )
}
