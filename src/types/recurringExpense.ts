import type { Category } from './category'

// Mirrors IRecurringExpenseResponse (backend recurring-expenses module).
export interface RecurringExpense {
  id: string
  name: string
  category: Category
  estimatedAmount: number
  /** Whether the real amount is always the same (rent) or varies (utilities). */
  isAmountFixed: boolean
  /** 1–31. */
  dayOfMonth: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRecurringExpenseInput {
  name: string
  category: Category
  estimatedAmount: number
  isAmountFixed?: boolean
  dayOfMonth: number
  active?: boolean
}

export type UpdateRecurringExpenseInput = Partial<CreateRecurringExpenseInput>
