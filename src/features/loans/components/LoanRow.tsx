import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { ProgressBar, progressPercentage } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { loanPath } from '@/lib/routes'
import type { Loan } from '@/types'

import { LoanDueDate } from './LoanDueDate'

export function LoanRow({ loan }: { loan: Loan }) {
  const { t } = useTranslation('loans')
  const { money } = useFormatters()

  return (
    <Link
      to={loanPath(loan.id)}
      className="-mx-3 block space-y-2 rounded-lg px-3 py-4 transition-colors hover:bg-ink/5"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="truncate font-medium">{loan.borrowerName}</span>
        <LoanDueDate loan={loan} className="shrink-0 text-xs text-ink-muted" />
      </div>
      {/* Recovered vs lent. */}
      <ProgressBar
        value={progressPercentage(loan.amountRepaid, loan.amount)}
        label={loan.borrowerName}
      />
      <p className="text-sm text-ink-muted tabular-nums">
        {t('progressLine', { pending: money(loan.remainingAmount), total: money(loan.amount) })}
      </p>
    </Link>
  )
}
