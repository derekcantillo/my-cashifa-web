import type { AccountSummary } from './account'
import type { Category } from './category'

// Mirrors ITransactionResponse (backend expenses module). The deprecated
// `monthYear` / `budgetPeriod` fields are intentionally not carried over.
export const TRANSACTION_TYPES = [
  'EXPENSE',
  'INCOME',
  'SAVING',
  'DEBT_PAYMENT',
  'LOAN_GIVEN',
  'LOAN_REPAYMENT',
] as const

export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export interface Transaction {
  id: string
  type: TransactionType
  category: Category
  amount: number
  /** ISO datetime. */
  transactionDate: string
  description: string | null
  tags: string[]
  accountId: string | null
  account: AccountSummary | null
  recurringExpenseId: string | null
  loanId: string | null
  periodId: string | null
  createdAt: string
  updatedAt: string
}

/** The backend rejects unknown fields, so this matches CreateTransactionDto exactly. */
export interface CreateTransactionInput {
  amount: number
  type: TransactionType
  category: Category
  description?: string
  accountId?: string | null
  recurringExpenseId?: string
  tags?: string[]
  /** ISO date; defaults to now on the backend. */
  transactionDate?: string
}

export type UpdateTransactionInput = Partial<Omit<CreateTransactionInput, 'recurringExpenseId'>>
