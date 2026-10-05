import type { Transaction, TransactionType } from '@/types'

/** Movements the loans flows write (POST /loans, POST /loans/:id/repayments). */
const LOAN_TYPES: readonly TransactionType[] = ['LOAN_GIVEN', 'LOAN_REPAYMENT']

/**
 * Loan movements are read-only in Gastos: editing or deleting them here would leave the
 * loan (amount, amountRepaid, status) and the account balance out of step, since the
 * backend doesn't propagate a transaction edit back to its loan. Every other type stays
 * editable. (The mobile app still allows it.)
 */
export function isLoanMovement(transaction: Pick<Transaction, 'type'>): boolean {
  return LOAN_TYPES.includes(transaction.type)
}

/** Where "Ver préstamo" goes: only with the exact reference the API returns (`loanId`). */
export function loanIdOf(transaction: Pick<Transaction, 'type' | 'loanId'>): string | null {
  return isLoanMovement(transaction) ? transaction.loanId : null
}
