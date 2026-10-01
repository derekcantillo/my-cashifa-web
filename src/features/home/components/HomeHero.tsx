import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Amount, EmptyState, Eyebrow, ProgressBar, SectionError, Skeleton } from '@/components/ui'
import { useBudgets, useFormatters, usePeriodLabel, usePeriodLedger } from '@/hooks'
import { getPeriodTiming } from '@/lib/periodTiming'
import type { FinancialPeriod } from '@/types'

import { PeriodStats } from './PeriodStats'

interface HomeHeroProps {
  period: FinancialPeriod | undefined
  isPeriodLoading: boolean
}

/**
 * The page's header: no card, straight on the canvas. Source of the hero figure:
 * GET /period-ledger — `availableToSpend` already includes the previous period's rollover.
 */
export function HomeHero({ period, isPeriodLoading }: HomeHeroProps) {
  const { t } = useTranslation('home')
  const ledger = usePeriodLedger(period?.id)
  const periodLabel = usePeriodLabel(period)

  if (!isPeriodLoading && !period) {
    return (
      <EmptyState
        icon={CalendarClock}
        title={t('hero.noPeriodTitle')}
        description={t('hero.noPeriodBody')}
        className="items-start px-0 text-left"
      />
    )
  }

  const timing = period ? getPeriodTiming(period) : undefined

  return (
    <section aria-labelledby="hero-label" className="space-y-8">
      <div className="space-y-3">
        {timing && periodLabel ? (
          <Eyebrow>
            {periodLabel} ·{' '}
            {timing.isOpen
              ? t('hero.day', { day: timing.elapsedDays })
              : t('hero.length', { count: timing.elapsedDays })}
          </Eyebrow>
        ) : (
          <Skeleton className="h-3.5 w-56" />
        )}

        <h2 id="hero-label" className="text-body text-ink-muted">
          {t('hero.label')}
        </h2>

        {ledger.isError ? (
          <SectionError onRetry={() => void ledger.refetch()} className="max-w-md" />
        ) : ledger.isPending ? (
          // Same line box as the display-lg / display-xl figure.
          <Skeleton className="h-11 w-64 max-w-full sm:h-14 sm:w-96" />
        ) : (
          <div className="space-y-2">
            <Amount
              value={ledger.data.availableToSpend}
              variant="hero"
              className={ledger.data.availableToSpend < 0 ? 'text-negative' : 'text-ink'}
            />
            {ledger.data.availableToSpend < 0 && (
              <p className="text-body text-ink-muted">{t('hero.deficit')}</p>
            )}
          </div>
        )}

        {period && <BudgetProgress periodId={period.id} />}
      </div>

      <PeriodStats period={period} ledger={ledger} />
    </section>
  )
}

/**
 * Spent vs. the period's total budget (sum of every category limit). Both sums come
 * from GET /budgets, whose `spentAmount` counts EXPENSE + DEBT_PAYMENT — the ledger's
 * definition of expenses. Omitted when there's no budget yet or it fails: the hero
 * figure doesn't depend on it.
 */
function BudgetProgress({ periodId }: { periodId: string }) {
  const { t } = useTranslation('home')
  const { money } = useFormatters()
  const { data, isPending } = useBudgets(periodId)

  if (isPending) {
    return (
      <div aria-hidden className="max-w-md space-y-2 pt-3">
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-3 w-44" />
      </div>
    )
  }

  const budget = (data ?? []).reduce((sum, line) => sum + line.limitAmount, 0)
  if (budget <= 0) return null
  const spent = (data ?? []).reduce((sum, line) => sum + line.spentAmount, 0)
  const percentage = (spent / budget) * 100

  return (
    <div className="max-w-md space-y-2 pt-3">
      <ProgressBar
        value={percentage}
        label={t('hero.budgetProgress')}
        tone={spent > budget ? 'negative' : 'accent'}
        className="h-1.5"
      />
      <p className="text-body-sm text-ink-muted tabular-nums">
        {t('hero.spentOfBudget', { spent: money(spent), budget: money(budget) })}
      </p>
    </div>
  )
}
