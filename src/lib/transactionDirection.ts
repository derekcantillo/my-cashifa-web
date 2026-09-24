import type { TransactionType } from '@/types'

/**
 * How a movement affects the money available. Only real income and real spending
 * get a color (DESIGN_PRINCIPLES #2); savings and money lent are just moved.
 */
export type TransactionDirection = 'in' | 'out' | 'moved'

const DIRECTIONS: Record<TransactionType, TransactionDirection> = {
  INCOME: 'in',
  LOAN_REPAYMENT: 'in',
  EXPENSE: 'out',
  DEBT_PAYMENT: 'out',
  SAVING: 'moved',
  LOAN_GIVEN: 'moved',
}

export function getTransactionDirection(type: TransactionType): TransactionDirection {
  return DIRECTIONS[type]
}
