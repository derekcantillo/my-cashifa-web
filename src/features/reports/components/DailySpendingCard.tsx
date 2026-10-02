import { Receipt } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts'

import {
  AXIS_LINE,
  AXIS_TICK,
  CHART_COLORS,
  ChartTooltip,
  GRID,
  LegendSwatch,
  moneyTickLabels,
  niceTicks,
  PROJECTION_DASH,
  tooltipDateFormat,
} from '@/components/charts'
import {
  Card,
  EmptyState,
  SectionError,
  SegmentedControl,
  Skeleton,
  type SegmentedOption,
} from '@/components/ui'
import { DESKTOP_QUERY, useFormatters, useMediaQuery, useTransactions } from '@/hooks'
import { cn } from '@/lib/cn'
import { dailySpendingSeries, hasFixedSpending, type DaySpending } from '@/lib/dailySpending'
import { dateKeyToDate, formatDate, formatDayMonth } from '@/lib/format'
import { getPeriodTiming } from '@/lib/periodTiming'
import type { FinancialPeriod } from '@/types'

type Mode = 'variable' | 'all'

/** X labels on a wide / narrow card (the month-start ones are always kept). */
const MAX_LABELS_WIDE = 12
const MAX_LABELS_NARROW = 6

/**
 * Days that get an X label: the first day, the first day of every month, and every
 * N-th day in between, skipping those too close to a month start.
 */
function xTicks(days: readonly DaySpending[], maxLabels: number): string[] {
  const every = Math.max(1, Math.ceil(days.length / maxLabels))
  const monthStarts = days
    .map((day, index) => (index > 0 && day.dateKey.endsWith('-01') ? index : -1))
    .filter(index => index !== -1)
  const nearMonthStart = (index: number) =>
    monthStarts.some(start => start !== index && Math.abs(index - start) < every)
  return days
    .filter(
      (_, index) =>
        monthStarts.includes(index) ||
        // The first day is labelled unless a month start sits right next to it.
        (index % every === 0 && !nearMonthStart(index)),
    )
    .map(day => day.dateKey)
}

interface DailySpendingCardProps {
  period: FinancialPeriod | undefined
  className?: string
}

/**
 * One bar per day from the period's start to today (or its last day), in Bogotá days:
 * neutral bars, the biggest day in accent, a dashed daily average. "Variables" (the
 * default when the period has spending linked to recurring expenses) leaves that fixed
 * spending out; "Todos" shows everything. The choice is local and survives period
 * changes while the screen stays mounted.
 */
export function DailySpendingCard({ period, className }: DailySpendingCardProps) {
  const { t } = useTranslation('reports')
  const { locale, money } = useFormatters()
  const { data, isPending, isError, refetch } = useTransactions(period?.id)
  const isWide = useMediaQuery(DESKTOP_QUERY)
  const [mode, setMode] = useState<Mode>('variable')

  // Without linked spending the split says nothing: no selector, everything shown.
  const canSplit = data ? hasFixedSpending(data) : false
  const effectiveMode: Mode = canSplit ? mode : 'all'

  const model = useMemo(() => {
    if (!period || !data) return null
    const timing = getPeriodTiming(period)
    const days = dailySpendingSeries(data, timing, { variableOnly: effectiveMode === 'variable' })
    const total = days.reduce((sum, day) => sum + day.amount, 0)
    const peak = days.reduce((max, day) => (day.amount > max.amount ? day : max), days[0])
    return { days, total, peak, average: total / timing.elapsedDays }
  }, [period, data, effectiveMode])

  const dateFormat = tooltipDateFormat(locale)
  const dayAndMonth = (dateKey: string) => formatDayMonth(dateKeyToDate(dateKey), locale)
  const ticks = model ? xTicks(model.days, isWide ? MAX_LABELS_WIDE : MAX_LABELS_NARROW) : []
  const firstTick = ticks[0]
  const scale = niceTicks(model?.peak.amount ?? 0)
  const yLabels = moneyTickLabels(scale.ticks, locale)

  const modeOptions: SegmentedOption<Mode>[] = [
    { value: 'variable', label: t('daily.modeVariable') },
    { value: 'all', label: t('daily.modeAll') },
  ]
  const title = effectiveMode === 'variable' ? t('daily.titleVariable') : t('daily.title')

  return (
    <Card as="section" aria-labelledby="daily-title" className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="daily-title" className="text-body font-semibold text-ink">
          {title}
        </h2>
        {canSplit && (
          <SegmentedControl
            label={t('daily.modeLabel')}
            value={mode}
            options={modeOptions}
            onChange={setMode}
            size="sm"
          />
        )}
      </div>

      {isError ? (
        <SectionError onRetry={() => void refetch()} className="mt-4" />
      ) : isPending || !model ? (
        <div aria-busy className="mt-5 space-y-4">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-3.5 w-56" />
        </div>
      ) : model.total === 0 ? (
        <EmptyState
          size="sm"
          icon={Receipt}
          title={t('daily.emptyTitle')}
          description={t('daily.emptyBody')}
          className="my-auto"
        />
      ) : (
        <>
          <figure className="mt-5 space-y-3">
            {/* The average's label lives here: on the chart it collided with low bars. */}
            <figcaption>
              <LegendSwatch
                label={t('daily.average', { amount: money(model.average) })}
                color={CHART_COLORS.projection}
                dashed
              />
            </figcaption>
            <div
              role="img"
              aria-label={t('daily.summary', {
                average: money(model.average),
                date: dayAndMonth(model.peak.dateKey),
                amount: money(model.peak.amount),
              })}
              className="h-56 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={model.days}
                  margin={{ top: 20, right: 8, bottom: 0, left: 0 }}
                  barCategoryGap="18%"
                  accessibilityLayer={false}
                >
                  <CartesianGrid {...GRID} />
                  <XAxis
                    dataKey="dateKey"
                    ticks={ticks}
                    interval={0}
                    // Month on the first label and on every month start: "29 sep", 30, "1 oct".
                    tickFormatter={(dateKey: string) =>
                      dateKey === firstTick || dateKey.endsWith('-01')
                        ? dayAndMonth(dateKey)
                        : formatDate(dateKeyToDate(dateKey), { locale, day: 'numeric' })
                    }
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                  />
                  <YAxis
                    domain={scale.domain}
                    ticks={scale.ticks}
                    interval={0}
                    tickFormatter={(value: number) => yLabels.get(value) ?? ''}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <Tooltip
                    cursor={{ fill: CHART_COLORS.grid }}
                    isAnimationActive={false}
                    content={({ active, payload }) => {
                      const day = payload?.[0]?.payload as DaySpending | undefined
                      return (
                        <ChartTooltip
                          active={active}
                          label={day && dateFormat.format(dateKeyToDate(day.dateKey))}
                          value={day && money(day.amount)}
                        />
                      )
                    }}
                  />
                  <ReferenceLine
                    y={model.average}
                    stroke={CHART_COLORS.projection}
                    strokeDasharray={PROJECTION_DASH}
                  />
                  <Bar
                    dataKey="amount"
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                    shape={ZeroAwareBar}
                  >
                    {model.days.map(day => (
                      <Cell
                        key={day.dateKey}
                        fill={
                          day.dateKey === model.peak.dateKey ? CHART_COLORS.main : CHART_COLORS.bar
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="sr-only">
              <caption>{title}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('daily.date')}</th>
                  <th scope="col">{t('daily.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {model.days.map(day => (
                  <tr key={day.dateKey}>
                    <td>{dateFormat.format(dateKeyToDate(day.dateKey))}</td>
                    <td>{money(day.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
          <div className="mt-4 space-y-1 border-t border-line pt-4 text-body-sm text-ink-muted tabular-nums">
            {effectiveMode === 'variable' && (
              <p>
                {t('daily.variableFooter', {
                  total: money(model.total),
                  average: money(model.average),
                })}
              </p>
            )}
            <p>
              {t('daily.peak', {
                date: dayAndMonth(model.peak.dateKey),
                amount: money(model.peak.amount),
              })}
            </p>
          </div>
        </>
      )}
    </Card>
  )
}

/**
 * Bars with rounded top corners; a day without spending gets a 2px mark on the baseline
 * (`line`), so "nothing spent" reads differently from "no data".
 */
function ZeroAwareBar({ x = 0, y = 0, width = 0, height = 0, fill, payload }: BarShapeProps) {
  if (!(payload as DaySpending | undefined)?.amount) {
    return <rect x={x} y={y - 2} width={width} height={2} fill="var(--color-line)" />
  }
  const radius = Math.min(3, width / 2, height)
  return (
    <path
      d={`M${x},${y + height} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + width - radius} Q${x + width},${y} ${x + width},${y + radius} V${y + height} Z`}
      fill={fill}
    />
  )
}
