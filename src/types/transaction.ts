import type { AccountSummary } from './account'
import type { Category } from './category'

// Mirrors ITransactionResponse (backend expenses module). The deprecated
// `monthYear` / `budgetPeriod` fields are intentionally not carried over.
/** Every type but TRANSFER: movements that have a real category. */
export const MOVEMENT_TYPES = [
  'EXPENSE',
  'INCOME',
  'SAVING',
  'DEBT_PAYMENT',
  'LOAN_GIVEN',
  'LOAN_REPAYMENT',
] as const

export const TRANSACTION_TYPES = [...MOVEMENT_TYPES, 'TRANSFER'] as const

export type TransactionType = (typeof TRANSACTION_TYPES)[number]
export type MovementType = (typeof MOVEMENT_TYPES)[number]

export interface Transaction {
  id: string
  type: TransactionType
  category: Category
  amount: number
  /** ISO datetime. */
  transactionDate: string
  description: string | null
  tags: string[]
  /** Origin of a TRANSFER; the account used otherwise. */
  accountId: string | null
  account: AccountSummary | null
  /** Destination of a TRANSFER; `null` for any other type. */
  toAccountId: string | null
  toAccount: AccountSummary | null
  recurringExpenseId: string | null
  loanId: string | null
  periodId: string | null
  createdAt: string
  updatedAt: string
}

/** The backend rejects unknown fields, so these match CreateTransactionDto exactly. */
export interface CreateMovementInput {
  amount: number
  type: MovementType
  category: Category
  description?: string
  accountId?: string | null
  recurringExpenseId?: string
  tags?: string[]
  /** ISO date; defaults to now on the backend. */
  transactionDate?: string
}

/**
 * Money between two of the user's own accounts (a card payment, a cash advance…).
 * Both accounts are required and different; the backend stores the category as OTHER.
 */
export interface CreateTransferInput {
  amount: number
  type: 'TRANSFER'
  /** Origin: its balance goes down. */
  accountId: string
  /** Destination: its balance goes up (paying a card moves its balance towards 0). */
  toAccountId: string
  description?: string
  tags?: string[]
  /** ISO date; defaults to now on the backend. */
  transactionDate?: string
}

export type CreateTransactionInput = CreateMovementInput | CreateTransferInput

/**
 * Matches UpdateTransactionDto. `recurringExpenseId`: a string links the movement to a
 * recurring expense, `null` unlinks it, omitted leaves the link as it is. `toAccountId`
 * only applies to a TRANSFER, and no movement can become one or stop being one.
 */
export type UpdateTransactionInput = Partial<
  Omit<CreateMovementInput, 'recurringExpenseId' | 'type'>
> & {
  type?: TransactionType
  recurringExpenseId?: string | null
  toAccountId?: string
}
