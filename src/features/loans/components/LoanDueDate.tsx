import { useTranslation } from 'react-i18next'

import { useFormatters } from '@/hooks'
import { toDateInputValue } from '@/lib/format'
import type { Loan } from '@/types'

/** "Vence el 15 de oct" / "Venció el 1 de sept" — quiet text, no badge. */
interface LoanDueDateProps {
  loan: Loan
  className?: string
  /** Rendered before the date only when there is one, e.g. a " · " separator. */
  prefix?: string
}

export function LoanDueDate({ loan, className, prefix = '' }: LoanDueDateProps) {
  const { t } = useTranslation('loans')
  const { shortDate } = useFormatters()
  if (!loan.dueDate || loan.status === 'PAID') return null
  const overdue = toDateInputValue(loan.dueDate) < toDateInputValue()
  return (
    <span className={className}>
      {prefix}
      {t(overdue ? 'overdue' : 'due', { date: shortDate(loan.dueDate) })}
    </span>
  )
}
