import { parseAmount } from '@/lib/parseAmount'
import type {
  CreateRecurringExpenseInput,
  RecurringExpense,
  UpdateRecurringExpenseInput,
} from '@/types'

import { apiClient } from './client'
import { toCategory, type RawAmount } from './mappers'

interface RawRecurringExpense {
  id: string
  name: string
  category: string
  estimatedAmount: RawAmount
  isAmountFixed: boolean
  dayOfMonth: number
  active: boolean
  createdAt: string
  updatedAt: string
}

function toRecurringExpense(raw: RawRecurringExpense): RecurringExpense {
  return {
    ...raw,
    category: toCategory(raw.category),
    estimatedAmount: parseAmount(raw.estimatedAmount),
  }
}

export interface RecurringExpensesRepository {
  list(): Promise<RecurringExpense[]>
  /** Active recurring expenses with no transaction registered in the period yet. */
  getPending(periodId: string): Promise<RecurringExpense[]>
  create(input: CreateRecurringExpenseInput): Promise<RecurringExpense>
  update(id: string, input: UpdateRecurringExpenseInput): Promise<RecurringExpense>
  remove(id: string): Promise<void>
}

const httpRecurringExpensesRepository: RecurringExpensesRepository = {
  async list() {
    const { data } = await apiClient.get<RawRecurringExpense[]>('/recurring-expenses')
    return data.map(toRecurringExpense)
  },
  async getPending(periodId) {
    const { data } = await apiClient.get<RawRecurringExpense[]>('/recurring-expenses/pending', {
      params: { periodId },
    })
    return data.map(toRecurringExpense)
  },
  async create(input) {
    const { data } = await apiClient.post<RawRecurringExpense>('/recurring-expenses', input)
    return toRecurringExpense(data)
  },
  async update(id, input) {
    const { data } = await apiClient.patch<RawRecurringExpense>(`/recurring-expenses/${id}`, input)
    return toRecurringExpense(data)
  },
  async remove(id) {
    await apiClient.delete(`/recurring-expenses/${id}`)
  },
}

export const recurringExpensesRepository: RecurringExpensesRepository =
  httpRecurringExpensesRepository
