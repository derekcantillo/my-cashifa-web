import { useTranslation } from 'react-i18next'

import { InlineError, Skeleton } from '@/components/ui'
import { useFormatters, usePeriodLedger } from '@/hooks'
import { cn } from '@/lib/utils'

/**
 * Savings capacity = the period's income minus its spending. Source: GET /period-ledger
 * (`income` = every INCOME, `expenses` = EXPENSE + DEBT_PAYMENT) — the same numbers as
 * the dashboard hero. `/reports/summary` doesn't carry income/expense totals.
 */
export function ReportSummaryHero({ periodId }: { periodId: string | undefined }) {
  const { t } = useTranslation('reports')
  const { money } = useFormatters()
  const { data: ledger, isPending, isError, refetch } = usePeriodLedger(periodId)

  const capacity = ledger ? ledger.income - ledger.expenses : 0
  // Only meaningful with income; avoids a division by zero.
  const rate = ledger && ledger.income > 0 ? Math.round((capacity / ledger.income) * 100) : null

  return (
    <section aria-labelledby="capacity-label" className="space-y-3">
      <p id="capacity-label" className="text-ink-muted">
        {t('hero.label')}
      </p>
      {isError ? (
        <InlineError onRetry={() => void refetch()} />
      ) : isPending ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-14 w-72 max-w-full" />
          <Skeleton className="h-5 w-64 max-w-full" />
        </div>
      ) : (
        <>
          <p
            className={cn(
              'text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl',
              capacity < 0 && 'text-danger',
            )}
          >
            {money(capacity)}
          </p>
          <p className="text-ink-muted tabular-nums">
            {t('hero.summary', { income: money(ledger.income), expenses: money(ledger.expenses) })}
            {rate !== null && rate > 0 && <> · {t('hero.rate', { percentage: rate })}</>}
          </p>
        </>
      )}
    </section>
  )
}
