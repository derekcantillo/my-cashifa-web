import { parseAmount } from '@/lib/parseAmount'
import type { BudgetLimitInput, BudgetLine } from '@/types'

import { apiClient } from './client'
import { toCategory, type RawAmount } from './mappers'

interface RawBudget {
  id: string
  periodId: string
  category: string
  limitAmount: RawAmount
  spentAmount: RawAmount
  percentage: number
}

function toBudgetLine(raw: RawBudget): BudgetLine {
  return {
    id: raw.id,
    periodId: raw.periodId,
    category: toCategory(raw.category),
    limitAmount: parseAmount(raw.limitAmount),
    spentAmount: parseAmount(raw.spentAmount),
    percentage: raw.percentage,
  }
}

export interface BudgetsRepository {
  getByPeriod(periodId: string): Promise<BudgetLine[]>
  /** Upserts the given categories' limits; returns every budget of the period. */
  setByPeriod(periodId: string, items: BudgetLimitInput[]): Promise<BudgetLine[]>
  /** Re-derives limits from the budget rules and recurring expenses. */
  recalculate(periodId: string): Promise<BudgetLine[]>
  /** Re-syncs `spentAmount` from the period's transactions. */
  reset(periodId: string): Promise<BudgetLine[]>
}

const httpBudgetsRepository: BudgetsRepository = {
  async getByPeriod(periodId) {
    const { data } = await apiClient.get<RawBudget[]>('/budgets', { params: { periodId } })
    return data.map(toBudgetLine)
  },
  async setByPeriod(periodId, items) {
    const { data } = await apiClient.put<RawBudget[]>(
      '/budgets',
      { items },
      { params: { periodId } },
    )
    return data.map(toBudgetLine)
  },
  async recalculate(periodId) {
    const { data } = await apiClient.post<RawBudget[]>(`/budgets/${periodId}/recalculate`)
    return data.map(toBudgetLine)
  },
  async reset(periodId) {
    const { data } = await apiClient.post<RawBudget[]>(`/budgets/${periodId}/reset`)
    return data.map(toBudgetLine)
  },
}

export const budgetsRepository: BudgetsRepository = httpBudgetsRepository
