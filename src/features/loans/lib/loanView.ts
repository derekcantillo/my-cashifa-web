import { sortLoans } from '@/lib/loanMath'
import { toDateInputValue } from '@/lib/format'
import type { Loan } from '@/types'

export interface LoanGroups {
  open: Loan[]
  paid: Loan[]
}

export const groupLoans = (loans: readonly Loan[]): LoanGroups => sortLoans(loans)

/** Default selection: the first open loan, else the most recently paid one. */
export function defaultLoan(groups: LoanGroups): Loan | undefined {
  return groups.open[0] ?? groups.paid[0]
}

/** Due date already behind us (Bogotá day), on a loan still owed. */
export function isOverdue(loan: Pick<Loan, 'dueDate' | 'status'>, now = new Date()): boolean {
  return (
    loan.status !== 'PAID' &&
    loan.dueDate !== null &&
    toDateInputValue(loan.dueDate) < toDateInputValue(now)
  )
}

/** Localized reminder for the borrower (the screen only copies it; nothing is sent). */
export function reminderText(
  t: (key: 'detail.reminderText', options: { name: string; amount: string }) => string,
  loan: Pick<Loan, 'borrowerName' | 'remainingAmount'>,
  money: (amount: number) => string,
): string {
  return t('detail.reminderText', {
    name: loan.borrowerName,
    amount: money(Math.max(0, loan.remainingAmount)),
  })
}
