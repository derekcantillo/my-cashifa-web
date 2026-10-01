import type { UseQueryResult } from '@tanstack/react-query'
import { RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Amount, IconButton, Skeleton, Stat } from '@/components/ui'
import { usePendingRecurringExpenses } from '@/hooks'
import type { FinancialPeriod, PeriodLedger } from '@/types'

interface PeriodStatsProps {
  period: FinancialPeriod | undefined
  /** Shared with the hero: same query, fetched once. */
  ledger: UseQueryResult<PeriodLedger>
}

/** Three figures in a row, split by hairlines (stacked on phones). */
export function PeriodStats({ period, ledger }: PeriodStatsProps) {
  const { t } = useTranslation(['home', 'common'])
  const pending = usePendingRecurringExpenses(period?.id)

  // A ledger error is already reported by the hero figure right above.
  const ledgerValue = (render: (data: PeriodLedger) => ReactNode) =>
    ledger.data ? render(ledger.data) : ledger.isError ? <NotAvailable /> : <ValueSkeleton />

  const pendingTotal = (pending.data ?? []).reduce((sum, item) => sum + item.estimatedAmount, 0)

  return (
    <div className="grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-y-0">
      <Stat
        label={t('home:stats.income')}
        className={CELL}
        value={ledgerValue(data => (
          <Amount value={data.income} className="text-positive" />
        ))}
      />

      <Stat
        label={t('home:stats.expenses')}
        className={CELL}
        value={ledgerValue(data => (
          <Amount value={data.expenses} />
        ))}
      />

      <Stat
        label={t('home:stats.pending')}
        className={CELL}
        hint={
          pending.data && pending.data.length > 0
            ? t('home:stats.pendingCount', { count: pending.data.length })
            : undefined
        }
        value={
          pending.isError ? (
            <span className="flex items-center gap-1">
              <NotAvailable />
              <IconButton
                label={t('common:common.retry')}
                icon={RotateCw}
                size="sm"
                onClick={() => void pending.refetch()}
              />
            </span>
          ) : !pending.data ? (
            <ValueSkeleton />
          ) : pending.data.length === 0 ? (
            <span className="font-normal text-ink-muted">{t('home:stats.upToDate')}</span>
          ) : (
            <Amount value={pendingTotal} />
          )
        }
      />
    </div>
  )
}

/** Stacked on phones (hairline between rows); a row split by vertical hairlines from `sm`. */
const CELL = 'py-4 sm:px-8 sm:py-1 sm:first:pl-0 sm:last:pr-0'

/** Same line box as the `title` figure (26px), so nothing jumps when data arrives. */
function ValueSkeleton() {
  return <Skeleton className="my-[3px] h-5 w-28" />
}

function NotAvailable() {
  return (
    <span className="text-ink-subtle" aria-hidden>
      —
    </span>
  )
}
