import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Amount,
  HeroProgress,
  HeroProgressSkeleton,
  SectionError,
  Skeleton,
  Stat,
} from '@/components/ui'
import { useFormatters, usePeriodLedger, useTransactions } from '@/hooks'
import { splitFixedSpending } from '@/lib/dailySpending'
import { formatPercent } from '@/lib/format'
import type { FinancialPeriod } from '@/types'

/** Stacked on phones (hairline between rows); a row split by vertical hairlines from `sm`. */
const CELL = 'py-4 sm:px-8 sm:py-1 sm:first:pl-0 sm:last:pr-0'

interface ReportsHeroProps {
  period: FinancialPeriod | undefined
  previousPeriod: FinancialPeriod | undefined
}

/**
 * Savings capacity = the period's income − its spending, from GET /period-ledger
 * (`income`: INCOME, effective; `expenses`: EXPENSE + DEBT_PAYMENT) — the same formula
 * and numbers the screen had before. The rate is that over income, rounded.
 */
export function ReportsHero({ period, previousPeriod }: ReportsHeroProps) {
  const { t } = useTranslation('reports')
  const { locale, money } = useFormatters()
  const ledger = usePeriodLedger(period?.id)
  const previousLedger = usePeriodLedger(previousPeriod?.id)
  const transactions = useTransactions(period?.id)

  if (ledger.isError) return <SectionError onRetry={() => void ledger.refetch()} />

  const data = ledger.data
  const capacity = data ? data.income - data.expenses : 0
  const rate = data && data.income > 0 ? Math.round((capacity / data.income) * 100) : null
  const fixed = transactions.data ? splitFixedSpending(transactions.data) : null

  const value = (node: () => ReactNode, ready: boolean) =>
    ready ? node() : <Skeleton className="my-[3px] h-5 w-28" />

  return (
    <div className="space-y-8">
      <section aria-labelledby="capacity-label" className="space-y-3">
        <h2 id="capacity-label" className="text-body text-ink-muted">
          {t('hero.label')}
        </h2>
        {!data ? (
          <div aria-busy className="space-y-3">
            <Skeleton className="h-11 w-64 max-w-full sm:h-14 sm:w-96" />
            <HeroProgressSkeleton className="pt-3" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Amount
                value={capacity}
                variant="hero"
                className={capacity < 0 ? 'text-negative' : 'text-ink'}
              />
              {capacity < 0 ? (
                <p className="text-body text-ink-muted">{t('hero.deficit')}</p>
              ) : (
                rate !== null && (
                  <p className="text-body text-ink-muted">
                    {t('hero.rate', { percent: formatPercent(rate / 100, { locale }) })}
                  </p>
                )
              )}
            </div>
            {data.income > 0 && (
              <HeroProgress
                value={(data.expenses / data.income) * 100}
                label={t('hero.progress')}
                tone={data.expenses > data.income ? 'negative' : 'accent'}
                caption={t('hero.spentOfIncome', {
                  spent: money(data.expenses),
                  income: money(data.income),
                })}
                className="pt-3"
              />
            )}
          </>
        )}
      </section>

      <div className="grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-y-0">
        <Stat
          label={t('stats.income')}
          className={CELL}
          value={value(
            () => (
              <Amount value={data?.income ?? 0} className="text-positive" />
            ),
            Boolean(data),
          )}
        />
        <Stat
          label={t('stats.expenses')}
          className={CELL}
          value={value(
            () => (
              <Amount value={data?.expenses ?? 0} />
            ),
            Boolean(data),
          )}
          // A plain reference, never a % change: an open period is partial.
          hint={
            previousLedger.data
              ? t('stats.previous', { amount: money(previousLedger.data.expenses) })
              : undefined
          }
        />
        {/* Fixed = spending linked to a recurring expense (Transaction.recurringExpenseId). */}
        {!transactions.isError && (
          <Stat
            label={t('stats.fixed')}
            className={CELL}
            value={value(
              () => (
                <Amount value={fixed?.fixed ?? 0} />
              ),
              Boolean(fixed),
            )}
            hint={
              fixed && fixed.total > 0
                ? t('stats.fixedShare', {
                    percent: formatPercent(Math.round((fixed.fixed / fixed.total) * 100) / 100, {
                      locale,
                    }),
                  })
                : undefined
            }
          />
        )}
      </div>
    </div>
  )
}
