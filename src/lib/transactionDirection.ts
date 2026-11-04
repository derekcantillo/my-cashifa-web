import type { TransactionType } from '@/types'

/**
 * How a movement affects the money available. Only real income and real spending
 * get a color (DESIGN_PRINCIPLES #2); savings, money lent and transfers between the
 * user's own accounts (card payments included) are just moved: they never count as
 * spending or income in any total or chart.
 */
export type TransactionDirection = 'in' | 'out' | 'moved'

const DIRECTIONS: Record<TransactionType, TransactionDirection> = {
  INCOME: 'in',
  LOAN_REPAYMENT: 'in',
  EXPENSE: 'out',
  DEBT_PAYMENT: 'out',
  SAVING: 'moved',
  LOAN_GIVEN: 'moved',
  TRANSFER: 'moved',
}

export function getTransactionDirection(type: TransactionType): TransactionDirection {
  return DIRECTIONS[type]
}
