import { APP_TIME_ZONE } from '@/lib/format'

/**
 * Shared chart style (set in Block 6, see DESIGN_PRINCIPLES #5): no grid, hairline
 * axis, 2px lines without animation, hover shows only a label + an amount.
 * Everything reads design tokens, so charts follow light/dark automatically.
 */
export const AXIS_TICK = { fill: 'var(--color-ink-muted)', fontSize: 12 }
export const AXIS_LINE = { stroke: 'var(--color-border)' }
export const CURSOR = { stroke: 'var(--color-border)', strokeWidth: 1 }
export const LINE_WIDTH = 2
export const PROJECTION_DASH = '6 5'
export const ACTIVE_DOT = { r: 4, strokeWidth: 2, stroke: 'var(--color-surface-elevated)' }

const LONG_RANGE_MS = 300 * 24 * 60 * 60 * 1000

/** Rounds up to a "nice" axis maximum (1, 1.5, 2, 3, 4.5, 6, 9 × 10ⁿ) so ticks land on round values. */
export function niceCeil(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 1.5, 2, 3, 4.5, 6, 9, 10].find(factor => factor * magnitude >= value) ?? 10
  return step * magnitude
}

/** Time-axis ticks: day + month, or month + year when the range crosses ~10 months. */
export function timeTickFormat(locale: string, spanMs: number): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(
    locale,
    spanMs > LONG_RANGE_MS
      ? { timeZone: APP_TIME_ZONE, month: 'short', year: '2-digit' }
      : { timeZone: APP_TIME_ZONE, day: 'numeric', month: 'short' },
  )
}

/** Full date for tooltips. */
export function tooltipDateFormat(locale: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Compact money for axis ticks ("$15 M"). */
export function compactMoneyFormat(locale: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'COP',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
}
