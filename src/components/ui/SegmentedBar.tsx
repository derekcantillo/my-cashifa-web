import { useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/cn'

export interface BarSegment {
  key: string
  /** Accessible name: what it is, amount and share — color is never the only cue. */
  label: string
  /** Relative width (any unit: shares or amounts). */
  weight: number
  /** Background class of its color (`bg-chart-<n>`). */
  fillClass: string
  /** Where it leads; without it the segment is a button running `onClick`. */
  href?: string
  onClick?: () => void
  /** For a button that shows/hides something (`aria-expanded`). */
  expanded?: boolean
}

export type HighlightHandlers = Record<
  'onMouseEnter' | 'onMouseLeave' | 'onFocus' | 'onBlur',
  () => void
>

/**
 * Hover/focus link between a bar and its legend: highlighting one key dims the rest
 * (to 55%) on both.
 */
export function useSegmentHighlight() {
  const [active, setActive] = useState<string | null>(null)
  return {
    active,
    highlight: (key: string | null): HighlightHandlers => ({
      onMouseEnter: () => setActive(key),
      onMouseLeave: () => setActive(null),
      onFocus: () => setActive(key),
      onBlur: () => setActive(null),
    }),
    dimmed: (key: string) => active !== null && active !== key,
  }
}

interface SegmentedBarProps {
  /** Accessible name of the whole bar. */
  label: string
  segments: readonly BarSegment[]
  highlight: ReturnType<typeof useSegmentHighlight>
  className?: string
}

/**
 * 10px composition bar: one segment per item, 2px gaps that show the surface behind,
 * at least 4px per segment, rounded ends. Every segment is focusable (link or button)
 * and named by its `label`.
 */
export function SegmentedBar({ label, segments, highlight, className }: SegmentedBarProps) {
  return (
    // 2px gaps show the card's own surface between segments.
    <div role="group" aria-label={label} className={cn('flex h-2.5 gap-0.5', className)}>
      {segments.map((segment, index) => {
        const segmentClassName = cn(
          'h-full min-w-1 transition-opacity duration-150 motion-reduce:transition-none',
          segment.fillClass,
          index === 0 && 'rounded-l-full',
          index === segments.length - 1 && 'rounded-r-full',
          highlight.dimmed(segment.key) && 'opacity-55',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
        )
        const style = { flex: `${segment.weight} 1 0` }
        return segment.href ? (
          <Link
            key={segment.key}
            to={segment.href}
            aria-label={segment.label}
            title={segment.label}
            className={segmentClassName}
            style={style}
            {...highlight.highlight(segment.key)}
          />
        ) : (
          <button
            key={segment.key}
            type="button"
            aria-label={segment.label}
            title={segment.label}
            aria-expanded={segment.expanded}
            onClick={segment.onClick}
            className={segmentClassName}
            style={style}
            {...highlight.highlight(segment.key)}
          />
        )
      })}
    </div>
  )
}
