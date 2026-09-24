import { parseAmount } from '@/lib/parseAmount'
import type {
  CreateTransactionInput,
  Transaction,
  TransactionType,
  UpdateTransactionInput,
} from '@/types'

import type { RawAccountSummary } from './accounts'
import { apiClient } from './client'
import { toCategory, type RawAmount } from './mappers'

interface RawTransaction {
  id: string
  amount: RawAmount
  type: TransactionType
  category: string
  description: string | null
  tags: string[]
  accountId: string | null
  account: RawAccountSummary | null
  recurringExpenseId: string | null
  loanId: string | null
  transactionDate: string
  periodId: string | null
  createdAt: string
  updatedAt: string
  // Deprecated `monthYear` / `budgetPeriod` are ignored.
}

function toTransaction(raw: RawTransaction): Transaction {
  return {
    id: raw.id,
    type: raw.type,
    category: toCategory(raw.category),
    amount: parseAmount(raw.amount),
    transactionDate: raw.transactionDate,
    description: raw.description,
    tags: raw.tags,
    accountId: raw.accountId,
    account: raw.account,
    recurringExpenseId: raw.recurringExpenseId,
    loanId: raw.loanId,
    periodId: raw.periodId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export interface TransactionsRepository {
  listByPeriod(periodId: string): Promise<Transaction[]>
  getById(id: string): Promise<Transaction>
  create(input: CreateTransactionInput): Promise<Transaction>
  update(id: string, input: UpdateTransactionInput): Promise<Transaction>
  remove(id: string): Promise<void>
}

const httpTransactionsRepository: TransactionsRepository = {
  async listByPeriod(periodId) {
    const { data } = await apiClient.get<RawTransaction[]>('/transactions', {
      params: { periodId },
    })
    return data.map(toTransaction)
  },
  async getById(id) {
    const { data } = await apiClient.get<RawTransaction>(`/transactions/${id}`)
    return toTransaction(data)
  },
  async create(input) {
    const { data } = await apiClient.post<RawTransaction>('/transactions', input)
    return toTransaction(data)
  },
  async update(id, input) {
    const { data } = await apiClient.patch<RawTransaction>(`/transactions/${id}`, input)
    return toTransaction(data)
  },
  async remove(id) {
    await apiClient.delete(`/transactions/${id}`)
  },
}

export const transactionsRepository: TransactionsRepository = httpTransactionsRepository
