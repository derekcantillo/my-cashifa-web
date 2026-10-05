import { ChevronRight } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, ProgressBar } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { cn } from '@/lib/cn'
import { formatDate, formatPercent } from '@/lib/format'
import { displayPercent, progressPercent } from '@/lib/goalMath'
import type { Loan } from '@/types'

import { isOverdue } from '../lib/loanView'

interface LoanListProps {
  open: readonly Loan[]
  paid: readonly Loan[]
  /** Highlighted item (desktop); `undefined` on phones, where the list is its own view. */
  selectedId: string | undefined
  onSelect: (loan: Loan) => void
}

/** Selected: sunken background and a 2px accent edge — the same as the goals list. */
function itemClassName(selected: boolean) {
  return cn(
    'w-full rounded-l-none rounded-r-md border-l-2 px-3 text-left transition-tactile',
    selected ? 'border-accent bg-surface-sunken' : 'border-transparent hover:bg-surface-sunken/60',
  )
}

/**
 * Loans in one card; each item is a button (↑/↓/Home/End move, Enter selects,
 * `aria-current` on the selected one). "Completados" starts open when nothing is owed.
 */
export function LoanList({ open, paid, selectedId, onSelect }: LoanListProps) {
  const { t } = useTranslation('loans')
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const items = [
      ...(listRef.current?.querySelectorAll<HTMLButtonElement>('[data-loan-item]') ?? []),
    ].filter(item => item.offsetParent !== null)
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (index === -1) return
    event.preventDefault()
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[next].focus()
  }

  return (
    <Card as="section" aria-label={t('list.label')} padding="sm">
      {/* Arrow keys bubble up from the item buttons (the focusable, native elements). */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- delegation only */}
      <div ref={listRef} onKeyDown={onKeyDown}>
        {open.length > 0 && (
          <ul className="space-y-1">
            {open.map(loan => (
              <li key={loan.id}>
                <OpenItem loan={loan} selected={loan.id === selectedId} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        )}
        {paid.length > 0 && (
          <details
            open={open.length === 0 || undefined}
            className={cn('group', open.length > 0 && 'mt-2 border-t border-line pt-2')}
          >
            <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-sm px-3 text-body-sm font-medium text-ink-muted transition-tactile hover:text-ink [&::-webkit-details-marker]:hidden">
              <ChevronRight
                aria-hidden
                className="size-4 transition-transform group-open:rotate-90"
              />
              {t('list.completed', { count: paid.length })}
            </summary>
            <ul className="mt-1 space-y-1">
              {paid.map(loan => (
                <li key={loan.id}>
                  <PaidItem loan={loan} selected={loan.id === selectedId} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </Card>
  )
}

interface ItemProps {
  loan: Loan
  selected: boolean
  onSelect: (loan: Loan) => void
}

function OpenItem({ loan, selected, onSelect }: ItemProps) {
  const { t } = useTranslation('loans')
  const { locale, money } = useFormatters()
  const due = loan.dueDate
    ? formatDate(loan.dueDate, { locale, day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <button
      type="button"
      data-loan-item
      aria-current={selected || undefined}
      onClick={() => onSelect(loan)}
      className={cn(itemClassName(selected), 'space-y-2 py-3')}
    >
      <span className="block truncate text-body font-medium text-ink">{loan.borrowerName}</span>
      <span className="flex items-baseline justify-between gap-3 text-body-sm tabular-nums">
        <span className="text-ink">
          {t('list.progress', { recovered: money(loan.amountRepaid), lent: money(loan.amount) })}
        </span>
        <span className="text-ink-muted">
          {formatPercent(displayPercent(loan.amountRepaid, loan.amount) / 100, { locale })}
        </span>
      </span>
      <ProgressBar
        value={progressPercent(loan.amountRepaid, loan.amount)}
        label={t('list.progressLabel', { name: loan.borrowerName })}
      />
      {due && (
        <span className="block text-body-sm text-ink-muted">
          {isOverdue(loan) ? t('list.overdue', { date: due }) : t('list.due', { date: due })}
        </span>
      )}
    </button>
  )
}

function PaidItem({ loan, selected, onSelect }: ItemProps) {
  const { t } = useTranslation('loans')
  const { money } = useFormatters()
  return (
    <button
      type="button"
      data-loan-item
      aria-current={selected || undefined}
      onClick={() => onSelect(loan)}
      className={cn(itemClassName(selected), 'flex items-baseline gap-3 py-2.5')}
    >
      <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{loan.borrowerName}</span>
      <span className="shrink-0 text-body-sm text-ink-muted tabular-nums">
        {t('list.paidOn', { amount: money(loan.amount) })}
      </span>
    </button>
  )
}
