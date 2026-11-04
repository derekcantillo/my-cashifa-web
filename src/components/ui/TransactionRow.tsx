import { ArrowLeftRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useFormatters } from '@/hooks'
import { cn } from '@/lib/cn'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { formatTime, hasClockTime } from '@/lib/format'
import { getTransactionDirection } from '@/lib/transactionDirection'
import { isCardPayment, isTransfer, transferRoute } from '@/lib/transfers'
import type { Transaction } from '@/types'

import { Skeleton } from './Skeleton'

interface TransactionRowProps {
  transaction: Transaction
  /** Makes the whole row a button (e.g. to open it for editing). */
  onSelect?: (transaction: Transaction) => void
  /** Hide the relative date when rows are already grouped by day. */
  showDate?: boolean
  /** In day-grouped lists: show the time instead, when the movement has a real one. */
  showTime?: boolean
  /** Name of the linked recurring expense: appends "· Fijo: <name>" to the subtitle. */
  recurringName?: string
}

/** Shared geometry: 56px tall, the icon column and the gaps line up with the skeleton. */
const ROW = 'flex min-h-14 items-center gap-3.5 py-2'

/**
 * Renders the contents of an `<li>`: plain category icon (no colored chip), title,
 * "Category · relative date" and the signed amount. Separators come from the list
 * (`divide-y divide-line`), so there's none after the last row. A transfer has no
 * category: it shows "Origin → Destination", a neutral amount and no sign.
 */
export function TransactionRow({
  transaction,
  onSelect,
  showDate = true,
  showTime = false,
  recurringName,
}: TransactionRowProps) {
  const { t } = useTranslation(['categories', 'transactions'])
  const { locale, money, relativeDay } = useFormatters()
  const transfer = isTransfer(transaction)
  const meta = CATEGORY_META[transaction.category]
  const Icon = transfer ? ArrowLeftRight : meta.icon
  // What names the movement when it has no note: its category, or the kind of transfer.
  const label = transfer
    ? t(
        isCardPayment(transaction)
          ? 'transactions:transfer.cardPayment'
          : 'transactions:transfer.label',
      )
    : t(meta.translationKey)
  const direction = getTransactionDirection(transaction.type)
  const secondary = [
    transfer
      ? transferRoute(transaction, t('transactions:transfer.missingAccount'))
      : transaction.description
        ? label
        : null,
    showDate ? relativeDay(transaction.transactionDate) : null,
    showTime && hasClockTime(transaction.transactionDate)
      ? formatTime(transaction.transactionDate, locale)
      : null,
    recurringName ? t('transactions:row.recurring', { name: recurringName }) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const content = (
    <>
      <Icon aria-hidden className="size-[18px] shrink-0 text-ink-muted" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-medium text-ink">
          {transaction.description || label}
        </span>
        {secondary && (
          <span className="block truncate text-body-sm text-ink-muted">{secondary}</span>
        )}
      </span>
      <span
        className={cn(
          'shrink-0 text-body font-medium tabular-nums',
          direction === 'in' && 'text-positive',
          direction === 'out' && 'text-negative',
          direction === 'moved' && 'text-ink',
        )}
      >
        {transfer ? '' : direction === 'in' ? '+' : '−'}
        {money(transaction.amount)}
      </span>
    </>
  )

  if (!onSelect) {
    return <div className={ROW}>{content}</div>
  }

  // Bleeds 12px past the list edges so the hover surface frames the content.
  return (
    <button
      type="button"
      onClick={() => onSelect(transaction)}
      className={cn(
        ROW,
        '-mx-3 w-[calc(100%+1.5rem)] rounded-md px-3 text-left transition-tactile',
        'hover:bg-surface-sunken/70 active:bg-surface-sunken',
      )}
    >
      {content}
    </button>
  )
}

/** Loading placeholder with the shape of `rows` transaction rows. */
export function TransactionRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-line" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className={ROW}>
          <Skeleton className="size-[18px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3.5 w-20" />
        </li>
      ))}
    </ul>
  )
}
