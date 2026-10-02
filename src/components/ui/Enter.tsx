import { useState, type AnimationEvent, type CSSProperties, type ReactNode } from 'react'

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
 * Fades a page block in (6px rise), `order` steps after the first. Plays once: the
 * class is dropped when it ends, so a block that is hidden and shown again with CSS
 * (`display: none` at some breakpoint) doesn't replay it. A block hidden from the
 * start plays it the first time it appears. Skipped with `prefers-reduced-motion`.
 */
export function Enter({ order, className, children }: EnterProps) {
  const [played, setPlayed] = useState(false)
  const style: CSSProperties | undefined = played
    ? undefined
    : { animationDelay: `${order * STAGGER_MS}ms` }

  const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    // Ignore animations of descendants (skeleton pulse, dialogs…), which bubble.
    if (event.target === event.currentTarget) setPlayed(true)
  }

  return (
    <div
      className={cn(!played && 'motion-safe:animate-enter', className)}
      style={style}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  )
}
