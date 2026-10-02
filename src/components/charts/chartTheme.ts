import { APP_TIME_ZONE } from '@/lib/format'

/**
 * The system chart style (Tactile Neo-Minimalism). Every color is a `var()` to a design
 * token, so charts follow light/dark with no JS. Recharts passes these to SVG
 * presentation attributes, where `var()` resolves like in CSS.
 *
 * - Axes and tick labels: `ink-subtle`, 13px (body-sm), no axis lines on Y.
 * - Grid: horizontal only, `line` at 60%.
 * - Main series: `accent`, 2px, dots only on hover/focus (4px).
 * - Projection: `ink-muted`, dashed. Target: horizontal reference in `positive`.
 * - Optional area under the main series: flat `accent` at 8% — never a gradient.
 * - No animation, no container border.
 */
export const CHART_COLORS = {
  main: 'var(--color-accent)',
  projection: 'var(--color-ink-muted)',
  target: 'var(--color-positive)',
  axis: 'var(--color-ink-subtle)',
  grid: 'var(--color-line)',
  /** Ring around active dots, so they read on top of the line. */
  dotRing: 'var(--color-surface-raised)',
} as const

export const AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 13 }
/** Baseline of the X axis: a hairline. */
export const AXIS_LINE = { stroke: CHART_COLORS.grid }
export const GRID = {
  stroke: CHART_COLORS.grid,
  strokeOpacity: 0.6,
  vertical: false,
} as const
export const CURSOR = { stroke: CHART_COLORS.grid, strokeWidth: 1 }
export const LINE_WIDTH = 2
export const PROJECTION_DASH = '6 5'
export const ACTIVE_DOT = { r: 4, strokeWidth: 2, stroke: CHART_COLORS.dotRing }
export const AREA_FILL = { fill: CHART_COLORS.main, fillOpacity: 0.08 } as const

const LONG_RANGE_MS = 300 * 24 * 60 * 60 * 1000

/** Rounds up to a "nice" axis maximum (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8 × 10ⁿ) so ticks land on round values. */
export function niceCeil(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step =
    [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10].find(factor => factor * magnitude >= value) ?? 10
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

/**
 * Month tick labels: "oct", or "oct 27" when the range crosses ~10 months (built from
 * parts: `es-CO` would otherwise say "oct de 27").
 */
export function monthTickLabel(locale: string, spanMs: number): (time: number) => string {
  const month = new Intl.DateTimeFormat(locale, { timeZone: APP_TIME_ZONE, month: 'short' })
  const year = new Intl.DateTimeFormat(locale, { timeZone: APP_TIME_ZONE, year: '2-digit' })
  const withYear = spanMs > LONG_RANGE_MS
  return time => {
    const label = month.format(time).replace(/\.$/, '')
    return withYear ? `${label} ${year.format(time)}` : label
  }
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
