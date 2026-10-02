import { useTranslation } from 'react-i18next'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ACTIVE_DOT,
  AREA_FILL,
  AXIS_LINE,
  AXIS_TICK,
  CHART_COLORS,
  ChartTooltip,
  compactMoneyFormat,
  CURSOR,
  GRID,
  LegendSwatch,
  LINE_WIDTH,
  monthTickLabel,
  niceCeil,
  PROJECTION_DASH,
  tooltipDateFormat,
} from '@/components/charts'
import { useFormatters } from '@/hooks'
import { dateKeyToDate, toDateInputValue } from '@/lib/format'
import { requiredContribution, savingsSeries } from '@/lib/goalMath'
import type { Goal } from '@/types'

interface ChartRow {
  time: number
  saved?: number
  projection?: number
  /** A day with contributions (not the flat extension to today). */
  real?: boolean
}

const MAX_TICKS = 6

/** First day of each month in the range, thinned to at most `MAX_TICKS`. */
function monthTicks(start: number, end: number): number[] {
  const ticks: number[] = []
  const cursor = new Date(start)
  cursor.setUTCDate(1)
  cursor.setUTCHours(17, 0, 0, 0)
  if (cursor.getTime() < start) cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  while (cursor.getTime() <= end) {
    ticks.push(cursor.getTime())
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  const step = Math.ceil(ticks.length / MAX_TICKS)
  return ticks.filter((_, index) => index % step === 0)
}

/**
 * Saved amount over time (one point per day with contributions, flat to today) and,
 * while the goal is open and its date ahead, a dashed projection from today to the
 * target at the required monthly contribution — a straight line, the pace that gets
 * there exactly on time. Alternative text: a summary label and a hidden table.
 * Render only when the goal has contributions.
 */
export function GoalProgressChart({ goal }: { goal: Goal }) {
  const { t } = useTranslation('goals')
  const { locale, money } = useFormatters()

  const now = new Date()
  const today = dateKeyToDate(toDateInputValue(now)).getTime()
  const series = savingsSeries(goal)
  const required = requiredContribution(goal, now)
  const targetTime = dateKeyToDate(toDateInputValue(goal.targetDate)).getTime()
  const projects = goal.status !== 'COMPLETED' && required.kind === 'monthly'

  const rows: ChartRow[] = series.map(point => ({
    time: dateKeyToDate(point.dateKey).getTime(),
    saved: point.amount,
    real: true,
  }))
  const last = rows[rows.length - 1]
  if (last.time < today) rows.push({ time: today, saved: last.saved })
  if (projects) {
    // The junction carries both series so the dashed line starts where the solid one ends.
    rows[rows.length - 1].projection = goal.currentAmount
    rows.push({ time: targetTime, projection: goal.targetAmount })
  }

  const start = rows[0].time
  const end = Math.max(today, rows[rows.length - 1].time)
  const singlePoint = series.length === 1
  const tickLabel = monthTickLabel(locale, end - start)
  const dateFormat = tooltipDateFormat(locale)
  const compactMoney = compactMoneyFormat(locale)
  const maxValue = Math.max(goal.targetAmount, ...series.map(point => point.amount))

  const summary = t('chart.summary', {
    saved: money(goal.currentAmount),
    target: money(goal.targetAmount),
    date: dateFormat.format(new Date(goal.targetDate)),
  })

  return (
    <figure className="space-y-3">
      <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <LegendSwatch label={t('chart.saved')} color={CHART_COLORS.main} />
        {projects && (
          <LegendSwatch
            label={t('chart.projection', { amount: money(required.amount) })}
            color={CHART_COLORS.projection}
            dashed
          />
        )}
      </figcaption>

      <div role="img" aria-label={summary} className="h-60 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ top: 22, right: 8, bottom: 0, left: 0 }}
            accessibilityLayer={false}
          >
            <CartesianGrid {...GRID} />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={[start, end]}
              ticks={monthTicks(start, end)}
              tickFormatter={(time: number) => tickLabel(time)}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={AXIS_LINE}
            />
            <YAxis
              domain={[0, niceCeil(maxValue * 1.05)]}
              tickCount={4}
              tickFormatter={(value: number) => compactMoney.format(value)}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <ReferenceLine
              y={goal.targetAmount}
              stroke={CHART_COLORS.target}
              strokeWidth={1.5}
              label={{
                value: t('chart.target'),
                position: 'insideTopLeft',
                fill: CHART_COLORS.target,
                fontSize: 13,
              }}
            />
            {end > today && (
              <ReferenceLine
                x={today}
                stroke={CHART_COLORS.axis}
                strokeOpacity={0.5}
                label={{
                  value: t('chart.today'),
                  position: 'top',
                  fill: CHART_COLORS.axis,
                  fontSize: 13,
                }}
              />
            )}
            <Tooltip
              cursor={CURSOR}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as ChartRow | undefined
                const isProjection = row?.saved === undefined
                const amount = row?.saved ?? row?.projection
                return (
                  <ChartTooltip
                    active={active}
                    label={row && dateFormat.format(row.time)}
                    series={isProjection ? t('chart.projectionSeries') : undefined}
                    value={amount === undefined ? undefined : money(amount)}
                  />
                )
              }}
            />
            <Area
              dataKey="saved"
              type="linear"
              stroke="none"
              {...AREA_FILL}
              isAnimationActive={false}
              activeDot={false}
              connectNulls
            />
            <Line
              dataKey="saved"
              type="linear"
              stroke={CHART_COLORS.main}
              strokeWidth={LINE_WIDTH}
              // Dots only on hover — except a single contribution, drawn as a point.
              dot={singlePoint ? singleDot : false}
              activeDot={ACTIVE_DOT}
              isAnimationActive={false}
              connectNulls
            />
            {projects && (
              <Line
                dataKey="projection"
                type="linear"
                stroke={CHART_COLORS.projection}
                strokeWidth={LINE_WIDTH}
                strokeDasharray={PROJECTION_DASH}
                dot={false}
                activeDot={ACTIVE_DOT}
                isAnimationActive={false}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>{t('chart.tableCaption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('chart.date')}</th>
            <th scope="col">{t('chart.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {series.map(point => (
            <tr key={point.dateKey}>
              <td>{dateFormat.format(dateKeyToDate(point.dateKey))}</td>
              <td>{money(point.amount)}</td>
            </tr>
          ))}
          <tr>
            <td>
              {t('chart.target')}: {dateFormat.format(new Date(goal.targetDate))}
            </td>
            <td>{money(goal.targetAmount)}</td>
          </tr>
        </tbody>
      </table>
    </figure>
  )
}

/** Dot for the real contribution day(s) when there's only one. */
function singleDot(props: { cx?: number; cy?: number; payload?: ChartRow; index?: number }) {
  if (!props.payload?.real || props.cx === undefined || props.cy === undefined) {
    return <g key={props.index} />
  }
  return (
    <circle
      key={props.index}
      cx={props.cx}
      cy={props.cy}
      r={4}
      fill={CHART_COLORS.main}
      stroke={CHART_COLORS.dotRing}
      strokeWidth={2}
    />
  )
}
