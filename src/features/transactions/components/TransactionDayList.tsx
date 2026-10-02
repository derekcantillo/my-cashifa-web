import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { TransactionRow } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { formatDayHeading, previousDateKey, toDateInputValue } from '@/lib/format'
import type { RecurringExpense, Transaction } from '@/types'

import type { DayGroup } from '../lib/transactionList'

interface TransactionDayListProps {
  groups: readonly DayGroup[]
  recurringById: ReadonlyMap<string, RecurringExpense>
  onSelect: (transaction: Transaction) => void
}

/**
 * Day groups inside one card. Every day shows its subtotal the same way: what went out
 * if anything did, otherwise what came in (in positive).
 */
/** Memoized: typing in the search box re-renders the page, not hundreds of rows. */
export const TransactionDayList = memo(function TransactionDayList({
  groups,
  recurringById,
  onSelect,
}: TransactionDayListProps) {
  const { t } = useTranslation('transactions')
  const { locale, money } = useFormatters()

  const today = toDateInputValue()
  const yesterday = previousDateKey(today)
  const dayLabel = (dateKey: string) =>
    dateKey === today
      ? t('page.today')
      : dateKey === yesterday
        ? t('page.yesterday')
        : formatDayHeading(dateKey, locale)

  return (
    <div className="divide-y divide-line">
      {groups.map(group => {
        const headingId = `day-${group.dateKey}`
        return (
          <section
            key={group.dateKey}
            aria-labelledby={headingId}
            className="py-4 first:pt-0 last:pb-0"
          >
            <div className="flex items-baseline justify-between gap-4 pb-1">
              <h2 id={headingId} className="text-body-sm font-semibold text-ink">
                {dayLabel(group.dateKey)}
              </h2>
              {group.spent > 0 ? (
                <p className="text-body-sm text-ink-muted tabular-nums">
                  {t('page.dayExpenses', { amount: money(group.spent) })}
                </p>
              ) : group.earned > 0 ? (
                <p className="text-body-sm text-positive tabular-nums">
                  {t('page.dayIncome', { amount: money(group.earned) })}
                </p>
              ) : null}
            </div>
            <ul className="divide-y divide-line">
              {group.transactions.map(transaction => (
                <li key={transaction.id}>
                  <TransactionRow
                    transaction={transaction}
                    showDate={false}
                    showTime
                    recurringName={
                      transaction.recurringExpenseId
                        ? recurringById.get(transaction.recurringExpenseId)?.name
                        : undefined
                    }
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
})
