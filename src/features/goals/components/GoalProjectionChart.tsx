import { useTranslation } from 'react-i18next'
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useFormatters } from '@/hooks'
import { APP_TIME_ZONE } from '@/lib/format'
import type { GoalProjection } from '@/lib/goalProjection'

interface ChartPoint {
  time: number
  actual?: number
  projected?: number
}

interface GoalProjectionChartProps {
  projection: GoalProjection
  targetAmount: number
}

// Chart styling reads the design tokens, so it follows light/dark automatically.
// Sets the tone for later charts: no grid, hairline axis, 2px lines, no animation,
// hover shows only date + amount (DESIGN_PRINCIPLES #5).
const AXIS_TICK = { fill: 'var(--color-ink-muted)', fontSize: 12 }
const LONG_RANGE_MS = 300 * 24 * 60 * 60 * 1000

/** Rounds up to a "nice" axis maximum (1, 1.5, 2, 3, 4.5, 6, 9 × 10ⁿ) so ticks land on round values. */
function niceCeil(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 1.5, 2, 3, 4.5, 6, 9, 10].find(factor => factor * magnitude >= value) ?? 10
  return step * magnitude
}

export function GoalProjectionChart({ projection, targetAmount }: GoalProjectionChartProps) {
  const { t } = useTranslation('goals')
  const { money, locale } = useFormatters()
  const { actual, projected } = projection

  const data: ChartPoint[] = actual.map(point => ({ time: point.time, actual: point.amount }))
  if (projected) {
    // The junction point carries both series so the dashed line starts where the solid one ends.
    data[data.length - 1].projected = projected[0].amount
    data.push({ time: projected[1].time, projected: projected[1].amount })
  }
  const lastActualIndex = actual.length - 1

  const dayFormat = new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  // Long ranges cross years: label ticks by month + year instead of day + month.
  const span = data[data.length - 1].time - data[0].time
  const tickFormat = new Intl.DateTimeFormat(
    locale,
    span > LONG_RANGE_MS
      ? { timeZone: APP_TIME_ZONE, month: 'short', year: '2-digit' }
      : { timeZone: APP_TIME_ZONE, day: 'numeric', month: 'short' },
  )
  const compactMoney = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'COP',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
  const maxValue = Math.max(
    targetAmount,
    ...data.map(p => Math.max(p.actual ?? 0, p.projected ?? 0)),
  )

  return (
    <figure className="space-y-3">
      {projected && (
        <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
          <LegendSwatch label={t('chart.actual')} />
          <LegendSwatch label={t('chart.projected')} dashed />
          {projection.monthlyRate !== null && (
            <span>{t('chart.pace', { amount: money(projection.monthlyRate) })}</span>
          )}
        </figcaption>
      )}
      <div role="img" aria-label={t('chart.description')} className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 16, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(time: number) => tickFormat.format(time)}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)' }}
              minTickGap={40}
            />
            <YAxis
              domain={[0, niceCeil(maxValue * 1.05)]}
              tickCount={4}
              tickFormatter={(value: number) => compactMoney.format(value)}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            {/* Solid hairline: dashing is reserved for the projection. */}
            <ReferenceLine
              y={targetAmount}
              stroke="var(--color-border)"
              label={{
                value: t('chart.targetLine', { amount: money(targetAmount) }),
                position: 'insideTopLeft',
                fill: 'var(--color-ink-muted)',
                fontSize: 12,
              }}
            />
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  point={payload?.[0]?.payload as ChartPoint | undefined}
                  dayFormat={dayFormat}
                  money={money}
                />
              )}
              cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Line
              dataKey="actual"
              name={t('chart.actual')}
              stroke="var(--color-brand)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-surface-elevated)' }}
              isAnimationActive={false}
              label={endLabel(lastActualIndex, projected ? '' : t('chart.actual'))}
            />
            {projected && (
              <Line
                dataKey="projected"
                name={t('chart.projected')}
                stroke="var(--color-ink-muted)"
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-surface-elevated)' }}
                isAnimationActive={false}
                connectNulls
                label={endLabel(data.length - 1, t('chart.projected'))}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}

/** Direct label on a line's last point (text in ink, never the series color). */
function endLabel(index: number, text: string) {
  function EndLabel(props: { index?: number; x?: number | string; y?: number | string }) {
    if (!text || props.index !== index) return null
    return (
      <text
        x={Number(props.x)}
        y={Number(props.y) - 10}
        textAnchor="end"
        fill="var(--color-ink-muted)"
        fontSize={12}
      >
        {text}
      </text>
    )
  }
  return EndLabel
}

function LegendSwatch({ label, dashed = false }: { label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="20" height="4" aria-hidden>
        <line
          x1="0"
          y1="2"
          x2="20"
          y2="2"
          strokeWidth="2"
          stroke={dashed ? 'var(--color-ink-muted)' : 'var(--color-brand)'}
          strokeDasharray={dashed ? '6 5' : undefined}
        />
      </svg>
      {label}
    </span>
  )
}

interface ChartTooltipProps {
  active: boolean | undefined
  point: ChartPoint | undefined
  dayFormat: Intl.DateTimeFormat
  money: (amount: number) => string
}

/** Hover shows only date + amount. */
function ChartTooltip({ active, point, dayFormat, money }: ChartTooltipProps) {
  if (!active || !point) return null
  const amount = point.actual ?? point.projected
  if (amount === undefined) return null
  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm shadow-sm">
      <p className="text-ink-muted">{dayFormat.format(point.time)}</p>
      <p className="font-medium tabular-nums">{money(amount)}</p>
    </div>
  )
}
