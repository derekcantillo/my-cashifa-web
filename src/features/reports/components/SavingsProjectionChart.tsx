import { useTranslation } from 'react-i18next'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import {
  ACTIVE_DOT,
  AXIS_LINE,
  AXIS_TICK,
  ChartTooltip,
  compactMoneyFormat,
  CURSOR,
  LINE_WIDTH,
  niceCeil,
  timeTickFormat,
  tooltipDateFormat,
} from '@/components/charts'
import { InlineError, Skeleton } from '@/components/ui'
import { useFormatters, useSavingsProjection } from '@/hooks'

interface ChartPoint {
  time: number
  amount: number
}

/**
 * GET /reports/savings-projection is not period-bound. Its `points` are the running
 * total of real contributions to ACTIVE goals (nothing projected), so it's a single
 * solid line; `markers` are those goals' target dates, listed under the chart.
 */
export function SavingsProjectionChart() {
  const { t } = useTranslation('reports')
  const { money, locale } = useFormatters()
  const { data, isPending, isError, refetch } = useSavingsProjection()

  const points: ChartPoint[] = (data?.points ?? []).map(point => ({
    time: Date.parse(point.date),
    amount: point.cumulativeAmount,
  }))
  const markers = data?.markers ?? []

  const span = points.length > 1 ? points[points.length - 1].time - points[0].time : 0
  const tickFormat = timeTickFormat(locale, span)
  const dateFormat = tooltipDateFormat(locale)
  const compactMoney = compactMoneyFormat(locale)
  const maxValue = Math.max(0, ...points.map(point => point.amount))

  return (
    <section
      aria-labelledby="projection-title"
      className="space-y-6 rounded-2xl border border-border bg-surface-elevated p-6"
    >
      <div className="space-y-1">
        <h2 id="projection-title" className="font-semibold">
          {t('projection.title')}
        </h2>
        <p className="text-sm text-ink-muted">{t('projection.subtitle')}</p>
      </div>

      {isError ? (
        <InlineError onRetry={() => void refetch()} />
      ) : isPending ? (
        <Skeleton className="h-56 w-full" />
      ) : points.length === 0 ? (
        <p className="py-6 text-ink-muted">{t('projection.empty')}</p>
      ) : points.length === 1 ? (
        <p className="py-6 text-ink-muted">
          {t('projection.single', { amount: money(points[0].amount) })}
        </p>
      ) : (
        <div role="img" aria-label={t('projection.description')} className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
              <Tooltip
                cursor={CURSOR}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as ChartPoint | undefined
                  return (
                    <ChartTooltip
                      active={active}
                      label={point && dateFormat.format(point.time)}
                      value={point && money(point.amount)}
                    />
                  )
                }}
              />
              <Line
                dataKey="amount"
                stroke="var(--color-brand)"
                strokeWidth={LINE_WIDTH}
                dot={false}
                activeDot={ACTIVE_DOT}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isPending && !isError && markers.length > 0 && (
        <div className="space-y-2 text-sm">
          <p className="text-ink-muted">{t('projection.targets')}</p>
          <ul className="space-y-1.5">
            {markers.map(marker => (
              <li key={`${marker.label}-${marker.date}`} className="flex justify-between gap-4">
                <span className="truncate">{marker.label}</span>
                <span className="shrink-0 text-ink-muted tabular-nums">
                  {dateFormat.format(Date.parse(marker.date))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
