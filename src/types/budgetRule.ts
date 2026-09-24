import type { Category } from './category'

// Mirrors IBudgetRuleResponse / IUpsertBudgetRulesResponse (backend budget-rules module).
export interface BudgetRule {
  category: Category
  /** 0–100. */
  targetPercentage: number
}

export interface BudgetRulesUpdateResult {
  rules: BudgetRule[]
  totalPercentage: number
  /** Set when `totalPercentage` exceeds 100 (rules are not required to sum exactly). */
  warning: string | null
}
