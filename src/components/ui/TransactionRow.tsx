import { useTranslation } from 'react-i18next'

import { useFormatters } from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { getTransactionDirection } from '@/lib/transactionDirection'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types'

import { Skeleton } from './Skeleton'

interface TransactionRowProps {
  transaction: Transaction
  /** Makes the whole row a button (e.g. to open it for editing). */
  onSelect?: (transaction: Transaction) => void
  /** Hide the relative date when rows are already grouped by day. */
  showDate?: boolean
}

/** Renders the contents of an `<li>`: category icon, name, date and signed amount. */
export function TransactionRow({ transaction, onSelect, showDate = true }: TransactionRowProps) {
  const { t } = useTranslation(['categories'])
  const { money, relativeDay } = useFormatters()
  const meta = CATEGORY_META[transaction.category]
  const Icon = meta.icon
  const category = t(meta.translationKey)
  const direction = getTransactionDirection(transaction.type)
  const secondary = [
    transaction.description ? category : null,
    showDate ? relativeDay(transaction.transactionDate) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const content = (
    <>
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{
          color: meta.color,
          backgroundColor: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
        }}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{transaction.description || category}</span>
        {secondary && <span className="block truncate text-sm text-ink-muted">{secondary}</span>}
      </span>
      <span
        className={cn(
          'shrink-0 font-medium tabular-nums',
          direction === 'in' && 'text-success',
          direction === 'out' && 'text-danger',
        )}
      >
        {direction === 'in' ? '+' : '−'}
        {money(transaction.amount)}
      </span>
    </>
  )

  if (!onSelect) {
    return <div className="flex items-center gap-4 py-3">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(transaction)}
      className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-ink/5 focus-visible:bg-ink/5"
    >
      {content}
    </button>
  )
}

/** Loading placeholder with the shape of `rows` transaction rows. */
export function TransactionRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-border" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="flex items-center gap-4 py-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </li>
      ))}
    </ul>
  )
}
