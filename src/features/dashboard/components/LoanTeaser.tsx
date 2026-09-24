import { useTranslation } from 'react-i18next'

import { useFormatters, useLoans } from '@/hooks'
import { ROUTES } from '@/lib/routes'
import type { Loan } from '@/types'

import { SectionLink } from './SectionLink'

/** Loans with a due date first (soonest first), then the rest in list order. */
function bySoonestDue(a: Loan, b: Loan): number {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
  if (a.dueDate) return -1
  if (b.dueDate) return 1
  return 0
}

/** Only renders when someone still owes money — never an empty card. */
export function LoanTeaser() {
  const { t } = useTranslation('dashboard')
  const { money, shortDate } = useFormatters()
  const { data } = useLoans()

  // `LoanStatus` is ACTIVE | PARTIALLY_PAID | PAID: anything not PAID is still owed.
  const [loan] = (data ?? []).filter(item => item.status !== 'PAID').sort(bySoonestDue)
  if (!loan) return null

  return (
    <section aria-labelledby="loan-title" className="space-y-3">
      <h2 id="loan-title" className="font-semibold">
        {t('loans.title')}
      </h2>
      <div className="space-y-1">
        <p className="text-sm text-ink-muted">{t('loans.owes', { name: loan.borrowerName })}</p>
        <p className="text-xl font-semibold tabular-nums">{money(loan.remainingAmount)}</p>
        {loan.dueDate && (
          <p className="text-sm text-ink-muted">
            {t('loans.due', { date: shortDate(loan.dueDate) })}
          </p>
        )}
      </div>
      <SectionLink to={ROUTES.loans}>{t('loans.seeAll')}</SectionLink>
    </section>
  )
}
