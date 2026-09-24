import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  InlineError,
  SegmentedControl,
  TransactionRow,
  TransactionRowsSkeleton,
  type SegmentedOption,
} from '@/components/ui'
import { useFormatters, useSelectedPeriod, useTransactions } from '@/hooks'
import { formatDayHeading, previousDateKey, toDateInputValue } from '@/lib/format'
import { getTransactionDirection } from '@/lib/transactionDirection'
import { useTransactionModalStore } from '@/store/transactionModalStore'
import type { Transaction } from '@/types'

type Filter = 'all' | 'income' | 'expense'

// "Ingresos" / "Gastos" follow the money direction used for colors: savings and
// money lent are neither, so they only appear under "Todos".
const MATCHES: Record<Filter, (transaction: Transaction) => boolean> = {
  all: () => true,
  income: transaction => getTransactionDirection(transaction.type) === 'in',
  expense: transaction => getTransactionDirection(transaction.type) === 'out',
}

interface DayGroup {
  dateKey: string
  transactions: Transaction[]
  /** Sum of the day's spending (direction `out`) among the shown transactions. */
  spent: number
}

function groupByDay(transactions: Transaction[]): DayGroup[] {
  const groups = new Map<string, DayGroup>()
  const sorted = [...transactions].sort((a, b) =>
    b.transactionDate.localeCompare(a.transactionDate),
  )
  for (const transaction of sorted) {
    const dateKey = toDateInputValue(transaction.transactionDate)
    const group = groups.get(dateKey) ?? { dateKey, transactions: [], spent: 0 }
    group.transactions.push(transaction)
    if (getTransactionDirection(transaction.type) === 'out') group.spent += transaction.amount
    groups.set(dateKey, group)
  }
  return [...groups.values()]
}

export function TransactionsPage() {
  const { t } = useTranslation(['transactions', 'layout', 'dashboard'])
  const { locale, money } = useFormatters()
  const { periodId } = useSelectedPeriod()
  const { data, isPending, isError, refetch } = useTransactions(periodId)
  const openModal = useTransactionModalStore(state => state.open)
  const [filter, setFilter] = useState<Filter>('all')

  const groups = useMemo(() => groupByDay((data ?? []).filter(MATCHES[filter])), [data, filter])

  const today = toDateInputValue()
  const yesterday = previousDateKey(today)
  const dayLabel = (dateKey: string) =>
    dateKey === today
      ? t('transactions:page.today')
      : dateKey === yesterday
        ? t('transactions:page.yesterday')
        : formatDayHeading(dateKey, locale)

  const filterOptions: SegmentedOption<Filter>[] = [
    { value: 'all', label: t('transactions:page.all') },
    { value: 'income', label: t('transactions:page.income') },
    { value: 'expense', label: t('transactions:page.expense') },
  ]

  const hasAny = (data?.length ?? 0) > 0

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('layout:nav.transactions')}</h1>
        <button
          type="button"
          onClick={() => openModal('create')}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
        >
          <Plus className="size-4" aria-hidden />
          {t('transactions:page.add')}
        </button>
      </header>

      <div className="max-w-xs">
        <SegmentedControl
          label={t('transactions:page.filter')}
          value={filter}
          options={filterOptions}
          onChange={setFilter}
        />
      </div>

      {isError ? (
        <InlineError onRetry={() => void refetch()} />
      ) : isPending ? (
        <TransactionRowsSkeleton rows={6} />
      ) : !hasAny ? (
        <p className="py-6 text-ink-muted">{t('dashboard:recent.empty')}</p>
      ) : groups.length === 0 ? (
        <p className="py-6 text-ink-muted">{t('transactions:page.emptyFiltered')}</p>
      ) : (
        <div className="space-y-8">
          {groups.map(group => {
            const headingId = `day-${group.dateKey}`
            return (
              <section key={group.dateKey} aria-labelledby={headingId}>
                <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
                  <h2 id={headingId} className="font-semibold">
                    {dayLabel(group.dateKey)}
                  </h2>
                  {group.spent > 0 && (
                    <p className="text-sm text-ink-muted tabular-nums">
                      {t('transactions:page.dayExpenses', { amount: money(group.spent) })}
                    </p>
                  )}
                </div>
                <ul className="divide-y divide-border">
                  {group.transactions.map(transaction => (
                    <li key={transaction.id}>
                      <TransactionRow
                        transaction={transaction}
                        showDate={false}
                        onSelect={({ id }) => openModal('edit', id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
