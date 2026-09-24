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

import {
  ACTIVE_DOT,
  AXIS_LINE,
  AXIS_TICK,
  ChartTooltip,
  compactMoneyFormat,
  CURSOR,
  LegendSwatch,
  LINE_WIDTH,
  niceCeil,
  PROJECTION_DASH,
  timeTickFormat,
  tooltipDateFormat,
} from '@/components/charts'
import { useFormatters } from '@/hooks'
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

  const span = data[data.length - 1].time - data[0].time
  const tickFormat = timeTickFormat(locale, span)
  const dateFormat = tooltipDateFormat(locale)
  const compactMoney = compactMoneyFormat(locale)
  const maxValue = Math.max(
    targetAmount,
    ...data.map(p => Math.max(p.actual ?? 0, p.projected ?? 0)),
  )

  return (
    <figure className="space-y-3">
      {projected && (
        <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
          <LegendSwatch label={t('chart.actual')} color="var(--color-brand)" />
          <LegendSwatch label={t('chart.projected')} color="var(--color-ink-muted)" dashed />
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
              axisLine={AXIS_LINE}
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
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as ChartPoint | undefined
                const amount = point?.actual ?? point?.projected
                return (
                  <ChartTooltip
                    active={active}
                    label={point && dateFormat.format(point.time)}
                    value={amount === undefined ? undefined : money(amount)}
                  />
                )
              }}
              cursor={CURSOR}
              isAnimationActive={false}
            />
            <Line
              dataKey="actual"
              name={t('chart.actual')}
              stroke="var(--color-brand)"
              strokeWidth={LINE_WIDTH}
              dot={false}
              activeDot={ACTIVE_DOT}
              isAnimationActive={false}
              label={endLabel(lastActualIndex, projected ? '' : t('chart.actual'))}
            />
            {projected && (
              <Line
                dataKey="projected"
                name={t('chart.projected')}
                stroke="var(--color-ink-muted)"
                strokeWidth={LINE_WIDTH}
                strokeDasharray={PROJECTION_DASH}
                dot={false}
                activeDot={ACTIVE_DOT}
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
