import { useTranslation } from 'react-i18next'

import { InlineError, Skeleton } from '@/components/ui'
import { useFormatters, usePeriodLedger } from '@/hooks'
import { cn } from '@/lib/utils'

interface BalanceHeroProps {
  periodId: string | undefined
  isPeriodLoading: boolean
}

/**
 * The dashboard's one hero metric. Source: GET /period-ledger — `availableToSpend`
 * already includes the rollover from the previous period.
 */
export function BalanceHero({ periodId, isPeriodLoading }: BalanceHeroProps) {
  const { t } = useTranslation('dashboard')
  const { money } = useFormatters()
  const { data: ledger, isPending, isError, refetch } = usePeriodLedger(periodId)

  if (!isPeriodLoading && !periodId) {
    return <p className="text-ink-muted">{t('balance.noPeriod')}</p>
  }

  return (
    <section aria-labelledby="balance-label" className="space-y-3">
      <p id="balance-label" className="text-ink-muted">
        {t('balance.label')}
      </p>

      {isError ? (
        <InlineError onRetry={() => void refetch()} />
      ) : isPending ? (
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-14 w-72 max-w-full" />
          <Skeleton className="h-5 w-64 max-w-full" />
        </div>
      ) : (
        <>
          <p
            className={cn(
              'text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl',
              ledger.availableToSpend < 0 && 'text-danger',
            )}
          >
            {money(ledger.availableToSpend)}
          </p>
          <p className="text-ink-muted tabular-nums">
            {t('balance.summary', {
              income: money(ledger.income),
              expenses: money(ledger.expenses),
            })}
          </p>
        </>
      )}
    </section>
  )
}
