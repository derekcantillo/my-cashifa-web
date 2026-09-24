import type { Category } from './category'

// Mirrors IBudgetResponse (backend budgets module).
export interface BudgetLine {
  id: string
  periodId: string
  category: Category
  limitAmount: number
  /** Derived by the backend from the period's transactions. */
  spentAmount: number
  /** `spentAmount / limitAmount * 100`, one decimal; 0 when the limit is 0. */
  percentage: number
}

export interface BudgetLimitInput {
  category: Category
  limitAmount: number
}
