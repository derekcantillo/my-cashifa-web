import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, CardHeader, SectionError, Skeleton } from '@/components/ui'
import { useFormatters, useTransactions } from '@/hooks'
import { cn } from '@/lib/cn'
import { dateKeyToDate, formatDate } from '@/lib/format'
import { getPeriodTiming } from '@/lib/periodTiming'
import type { FinancialPeriod } from '@/types'

import { buildSpendingPace, PACE_DAYS, type PaceDay } from '../lib/spendingPace'

/** Height of the plot area; bars scale to the tallest day. */
const PLOT_HEIGHT = 'h-36'

interface SpendingPaceCardProps {
  period: FinancialPeriod | undefined
  className?: string
}

/**
 * Last 7 calendar days of the period as plain bars (no chart library: seven divs
 * keep Recharts out of the Home chunk). Today in accent, the rest neutral.
 */
export function SpendingPaceCard({ period, className }: SpendingPaceCardProps) {
  const { t } = useTranslation('home')
  const { locale, money } = useFormatters()
  const { data, isPending, isError, refetch } = useTransactions(period?.id)

  const pace = useMemo(
    () => (period && data ? buildSpendingPace(data, getPeriodTiming(period)) : undefined),
    [period, data],
  )

  const format = (dateKey: string, options: Intl.DateTimeFormatOptions) =>
    formatDate(dateKeyToDate(dateKey), { locale, ...options })
  const weekday = (dateKey: string) => format(dateKey, { weekday: 'short' })
  const dayOfMonth = (dateKey: string) => format(dateKey, { day: 'numeric' })
  const shortDay = (dateKey: string) =>
    format(dateKey, { weekday: 'short', day: 'numeric', month: 'short' })
  const fullDay = (dateKey: string) =>
    format(dateKey, { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <Card as="section" aria-labelledby="pace-title" className={cn('flex flex-col', className)}>
      <CardHeader title={t('pace.title')} titleId="pace-title" />

      {isError ? (
        <SectionError onRetry={() => void refetch()} className="mt-6" />
      ) : isPending || !pace ? (
        <PaceSkeleton />
      ) : (
        <>
          <ol aria-label={t('pace.chartLabel')} className="mt-6 grid grid-cols-7 gap-2 sm:gap-3">
            {pace.days.map(day => (
              <PaceBar
                key={day.dateKey}
                day={day}
                maxAmount={pace.maxAmount}
                label={day.isToday ? t('pace.today') : weekday(day.dateKey)}
                dayOfMonth={dayOfMonth(day.dateKey)}
                description={
                  day.inPeriod
                    ? t('pace.dayAmount', { day: fullDay(day.dateKey), amount: money(day.amount) })
                    : t('pace.outsidePeriod', { day: fullDay(day.dateKey) })
                }
              />
            ))}
          </ol>

          <div className="mt-6 border-t border-line pt-4">
            {pace.total === 0 ? (
              <p className="text-body-sm text-ink-muted">{t('pace.empty')}</p>
            ) : (
              <dl className="flex flex-wrap gap-x-8 gap-y-2 text-body-sm">
                <div className="flex gap-1.5">
                  <dt className="text-ink-muted">{t('pace.dailyAverage')}</dt>
                  <dd className="font-medium text-ink tabular-nums">{money(pace.dailyAverage)}</dd>
                </div>
                {pace.peak && (
                  <div className="flex gap-1.5">
                    <dt className="text-ink-muted">{t('pace.peakDay')}</dt>
                    <dd className="font-medium text-ink tabular-nums">
                      {shortDay(pace.peak.dateKey)} · {money(pace.peak.amount)}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </>
      )}
    </Card>
  )
}

interface PaceBarProps {
  day: PaceDay
  maxAmount: number
  /** Weekday under the bar ("mié", or "Hoy"). */
  label: string
  /** Second line under the weekday. */
  dayOfMonth: string
  /** Accessible name and native tooltip, with the amount. */
  description: string
}

function PaceBar({ day, maxAmount, label, dayOfMonth, description }: PaceBarProps) {
  const hasAmount = day.inPeriod && day.amount > 0
  // Spending days get at least 4% so a small amount is still visible next to a big one.
  const height = hasAmount && maxAmount > 0 ? Math.max(4, (day.amount / maxAmount) * 100) : 0

  return (
    <li className="flex min-w-0 flex-col items-center gap-2">
      <div className={cn('flex w-full items-end justify-center', PLOT_HEIGHT)}>
        <div
          role="img"
          aria-label={description}
          title={description}
          className={cn(
            'w-full max-w-11',
            hasAmount
              ? cn('rounded-t-[6px]', day.isToday ? 'bg-accent' : 'bg-ink-subtle/25')
              : // Flat baseline: a day without spending, or before the period started.
                cn(
                  'h-0.5 rounded-full',
                  !day.inPeriod
                    ? 'bg-surface-sunken'
                    : day.isToday
                      ? 'bg-accent'
                      : 'bg-ink-subtle/25',
                ),
          )}
          style={hasAmount ? { height: `${height}%` } : undefined}
        />
      </div>
      <span aria-hidden className="flex max-w-full flex-col items-center text-body-sm">
        <span
          className={cn(
            'max-w-full truncate',
            day.isToday
              ? 'font-medium text-ink'
              : day.inPeriod
                ? 'text-ink-muted'
                : 'text-ink-subtle',
          )}
        >
          {label}
        </span>
        <span className="text-ink-subtle tabular-nums">{dayOfMonth}</span>
      </span>
    </li>
  )
}

function PaceSkeleton() {
  return (
    <div aria-busy className="mt-6">
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {Array.from({ length: PACE_DAYS }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className={cn('flex w-full items-end justify-center', PLOT_HEIGHT)}>
              <Skeleton className="h-1/3 w-full max-w-11 rounded-b-none" />
            </div>
            <div className="space-y-2 py-1">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="mx-auto h-3 w-4" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t border-line pt-4">
        <Skeleton className="h-3.5 w-56" />
      </div>
    </div>
  )
}
