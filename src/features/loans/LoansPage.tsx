import { ChevronRight, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { InlineError, Skeleton } from '@/components/ui'
import { useFormatters, useLoans } from '@/hooks'
import { loanPath } from '@/lib/routes'
import { useLoanModalStore } from '@/store/loanModalStore'
import type { Loan } from '@/types'

import { LoanRow } from './components/LoanRow'

/** Loans with a due date first (soonest first), then the rest in list order. */
function bySoonestDue(a: Loan, b: Loan): number {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
  if (a.dueDate) return -1
  if (b.dueDate) return 1
  return 0
}

export function LoansPage() {
  const { t } = useTranslation('loans')
  const { money } = useFormatters()
  const { data, isPending, isError, refetch } = useLoans()
  const openModal = useLoanModalStore(state => state.open)

  // `LoanStatus` is ACTIVE | PARTIALLY_PAID | PAID: anything not PAID is still owed.
  const active = (data ?? []).filter(loan => loan.status !== 'PAID').sort(bySoonestDue)
  const completed = (data ?? []).filter(loan => loan.status === 'PAID')

  const newLoanButton = (
    <button
      type="button"
      onClick={() => openModal('create')}
      className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
    >
      <Plus className="size-4" aria-hidden />
      {t('new')}
    </button>
  )

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        {(data?.length ?? 0) > 0 && newLoanButton}
      </header>

      {isError ? (
        <InlineError onRetry={() => void refetch()} />
      ) : isPending ? (
        <ul className="divide-y divide-border" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="space-y-3 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-56" />
            </li>
          ))}
        </ul>
      ) : data.length === 0 ? (
        <div className="space-y-4 py-6">
          <p className="text-ink-muted">{t('empty')}</p>
          {newLoanButton}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <ul className="divide-y divide-border">
              {active.map(loan => (
                <li key={loan.id}>
                  <LoanRow loan={loan} />
                </li>
              ))}
            </ul>
          )}

          {completed.length > 0 && (
            <details className="group">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  className="size-4 transition-transform group-open:rotate-90"
                  aria-hidden
                />
                {t('showCompleted', { count: completed.length })}
              </summary>
              <ul className="mt-3 divide-y divide-border">
                {completed.map(loan => (
                  <li key={loan.id}>
                    <Link
                      to={loanPath(loan.id)}
                      className="flex items-center justify-between gap-4 py-3 text-sm hover:text-brand"
                    >
                      <span className="truncate">{loan.borrowerName}</span>
                      <span className="shrink-0 text-ink-muted tabular-nums">
                        {money(loan.amount)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  )
}
