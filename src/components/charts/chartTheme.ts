import { APP_TIME_ZONE, formatMoney } from '@/lib/format'

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
  /** Neutral bars (the highlighted one uses `main`). ≥ 3:1 on surface-raised. */
  bar: 'var(--color-chart-bar)',
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

const STEP_FACTORS = [1, 2, 2.5, 5] as const
const MAX_INTERVALS = 4

export interface NiceScale {
  /** `[0, top]`: the top grid line is exactly the domain maximum. */
  domain: [number, number]
  /** Evenly spaced, starting at 0 and ending at `top`. */
  ticks: number[]
}

/** Removes float noise (0.30000000000000004 → 0.3). */
function clean(value: number): number {
  return Number(value.toPrecision(12))
}

/**
 * Y scale for a chart of non-negative amounts: the step is the smallest of
 * {1, 2, 2.5, 5} × 10ⁿ that covers `max` in at most four intervals; the domain ends on
 * the last tick. A zero (or invalid) max gives a minimal `[0, 1]` domain with only the
 * 0 tick.
 */
export function niceTicks(max: number): NiceScale {
  if (!Number.isFinite(max) || max <= 0) return { domain: [0, 1], ticks: [0] }
  let exponent = Math.floor(Math.log10(max / MAX_INTERVALS))
  for (;;) {
    for (const factor of STEP_FACTORS) {
      const step = clean(factor * 10 ** exponent)
      const intervals = Math.ceil(clean(max / step))
      if (intervals <= MAX_INTERVALS) {
        const ticks = Array.from({ length: intervals + 1 }, (_, index) => clean(index * step))
        return { domain: [0, ticks[ticks.length - 1]], ticks }
      }
    }
    exponent += 1
  }
}

/**
 * Compact money labels for `ticks` ("$1M", "$2,5M"): up to one decimal, more only if
 * two different ticks would otherwise read the same.
 */
export function moneyTickLabels(ticks: readonly number[], locale: string): Map<number, string> {
  for (let digits = 1; digits <= 4; digits += 1) {
    const labels = ticks.map(tick =>
      formatMoney(tick, { compact: true, compactFractionDigits: digits, locale }),
    )
    if (new Set(labels).size === labels.length || digits === 4) {
      return new Map(ticks.map((tick, index) => [tick, labels[index]]))
    }
  }
  return new Map()
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
