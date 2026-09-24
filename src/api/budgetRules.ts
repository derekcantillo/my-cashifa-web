import { parseAmount } from '@/lib/parseAmount'
import type { BudgetRule, BudgetRulesUpdateResult } from '@/types'

import { apiClient } from './client'
import { toCategory, type RawAmount } from './mappers'

interface RawBudgetRule {
  category: string
  targetPercentage: RawAmount
}

interface RawBudgetRulesUpdateResult {
  rules: RawBudgetRule[]
  totalPercentage: RawAmount
  warning: string | null
}

function toBudgetRule(raw: RawBudgetRule): BudgetRule {
  return { category: toCategory(raw.category), targetPercentage: parseAmount(raw.targetPercentage) }
}

export interface BudgetRulesRepository {
  get(): Promise<BudgetRule[]>
  /** Upserts the given rules; categories not sent keep their current rule. */
  update(rules: BudgetRule[]): Promise<BudgetRulesUpdateResult>
}

const httpBudgetRulesRepository: BudgetRulesRepository = {
  async get() {
    const { data } = await apiClient.get<RawBudgetRule[]>('/budget-rules')
    return data.map(toBudgetRule)
  },
  async update(rules) {
    const { data } = await apiClient.put<RawBudgetRulesUpdateResult>('/budget-rules', { rules })
    return {
      rules: data.rules.map(toBudgetRule),
      totalPercentage: parseAmount(data.totalPercentage),
      warning: data.warning,
    }
  },
}

export const budgetRulesRepository: BudgetRulesRepository = httpBudgetRulesRepository
