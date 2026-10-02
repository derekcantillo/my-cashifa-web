import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Amount, SectionError, Skeleton, Stat } from '@/components/ui'
import { usePeriodLedger } from '@/hooks'

interface TransactionsSummaryProps {
  periodId: string | undefined
  /** Movements in the period (from the list query, already loaded by the page). */
  count: number | undefined
}

/** Stacked on phones (hairline between rows); a row split by vertical hairlines from `sm`. */
const CELL = 'py-4 sm:px-8 sm:py-1 sm:first:pl-0 sm:last:pr-0'

/**
 * Income and expenses come from the period ledger — the same figures as Home (the
 * ledger's income excludes loan repayments; its expenses are EXPENSE + DEBT_PAYMENT).
 */
export function TransactionsSummary({ periodId, count }: TransactionsSummaryProps) {
  const { t } = useTranslation('transactions')
  const ledger = usePeriodLedger(periodId)

  if (ledger.isError) {
    return <SectionError onRetry={() => void ledger.refetch()} />
  }

  const value = (render: () => ReactNode, ready: boolean) =>
    ready ? render() : <Skeleton className="my-[3px] h-5 w-28" />

  return (
    <div className="grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-y-0">
      <Stat
        label={t('page.stats.expenses')}
        className={CELL}
        value={value(
          () => (
            <Amount value={ledger.data?.expenses ?? 0} />
          ),
          Boolean(ledger.data),
        )}
      />
      <Stat
        label={t('page.stats.income')}
        className={CELL}
        value={value(
          () => (
            <Amount value={ledger.data?.income ?? 0} className="text-positive" />
          ),
          Boolean(ledger.data),
        )}
      />
      <Stat
        label={t('page.stats.count')}
        className={CELL}
        value={value(
          () => (
            <span>{count}</span>
          ),
          count !== undefined,
        )}
      />
    </div>
  )
}
