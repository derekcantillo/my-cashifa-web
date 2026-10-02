import { useTranslation } from 'react-i18next'

import { Button, Card, CardHeader, SectionError, Skeleton } from '@/components/ui'
import { useFormatters, usePendingRecurringExpenses } from '@/hooks'
import { useTransactionModalStore } from '@/store/transactionModalStore'

interface PendingRecurringCardProps {
  periodId: string | undefined
  className?: string
}

/** Active recurring expenses with nothing registered in the period yet. */
export function PendingRecurringCard({ periodId, className }: PendingRecurringCardProps) {
  const { t } = useTranslation('transactions')
  const { money } = useFormatters()
  const { data, isPending, isError, refetch } = usePendingRecurringExpenses(periodId)
  const openForRecurring = useTransactionModalStore(state => state.openForRecurring)

  return (
    <Card as="section" aria-labelledby="pending-title" className={className}>
      <CardHeader title={t('pending.title')} titleId="pending-title" />

      {isError ? (
        <SectionError onRetry={() => void refetch()} className="mt-4" />
      ) : isPending ? (
        <ul aria-busy className="mt-2 divide-y divide-line">
          {[0, 1, 2].map(index => (
            <li key={index} className="flex items-center gap-3 py-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3.5 w-16" />
            </li>
          ))}
        </ul>
      ) : data.length === 0 ? (
        <p className="mt-3 text-body text-ink-muted">{t('pending.upToDate')}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {data.map(expense => (
            <li key={expense.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium text-ink">{expense.name}</p>
                <p className="text-body-sm text-ink-muted tabular-nums">
                  {money(expense.estimatedAmount)} · {t('pending.due', { day: expense.dayOfMonth })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('pending.registerLabel', { name: expense.name })}
                onClick={() => openForRecurring(expense)}
                className="-mr-2 text-accent hover:text-accent"
              >
                {t('pending.register')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
