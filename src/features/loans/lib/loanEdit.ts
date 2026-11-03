import { toDateInputValue } from '@/lib/format'
import type { LoanRepayment } from '@/types'

/**
 * The repayment made on the earliest day, or `undefined` with none. The loan date
 * can't move past it.
 */
export function firstRepayment<T extends Pick<LoanRepayment, 'paidAt'>>(
  repayments: readonly T[],
): T | undefined {
  return repayments.reduce<T | undefined>(
    (first, repayment) =>
      first === undefined || repayment.paidAt < first.paidAt ? repayment : first,
    undefined,
  )
}

export type LoanAmountError = 'amountPositive' | 'amountBelowRepaid'

/** PATCH /loans/:id answers 400 for an amount below what was already repaid. */
export function loanAmountError(amount: number, amountRepaid: number): LoanAmountError | null {
  if (!(amount > 0)) return 'amountPositive'
  if (amount < amountRepaid) return 'amountBelowRepaid'
  return null
}

/**
 * Whether a repayment day (`YYYY-MM-DD`) falls before the loan's day (Bogotá), which
 * POST /loans/:id/repayments rejects. The same day is fine whatever the times.
 */
export function repaymentBeforeLoan(paidDate: string, loanDate: string): boolean {
  return paidDate < toDateInputValue(loanDate)
}

/**
 * Whether a loan date (`YYYY-MM-DD`) falls after the first repayment's day. Like the
 * backend, it compares Bogotá calendar days: a loan and a repayment on the same day
 * are fine whatever their times.
 */
export function loanDateAfterFirstRepayment(
  loanDate: string,
  first: Pick<LoanRepayment, 'paidAt'> | undefined,
): boolean {
  return first !== undefined && loanDate > toDateInputValue(first.paidAt)
}
