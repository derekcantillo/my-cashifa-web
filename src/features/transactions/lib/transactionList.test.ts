import { describe, expect, it, vi } from 'vitest'

import type { Transaction, TransactionType } from '@/types'

import {
  categoriesOf,
  countByDirection,
  groupByDay,
  matchesDirection,
  matchesSearchAndCategory,
} from './transactionList'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

const STAMP = '2026-10-04T17:00:00.000Z'

function tx(id: string, type: TransactionType, amount: number): Transaction {
  return {
    id,
    type,
    category: type === 'TRANSFER' ? 'OTHER' : 'FOOD',
    amount,
    transactionDate: STAMP,
    description: null,
    tags: [],
    accountId: 'acc_savings',
    account: {
      id: 'acc_savings',
      name: 'Ahorros Bancolombia',
      type: 'DEBIT_CARD',
      createdAt: STAMP,
      updatedAt: STAMP,
    },
    toAccountId: type === 'TRANSFER' ? 'acc_card' : null,
    toAccount:
      type === 'TRANSFER'
        ? {
            id: 'acc_card',
            name: 'TC VISA Clásica',
            type: 'CREDIT_CARD',
            createdAt: STAMP,
            updatedAt: STAMP,
          }
        : null,
    recurringExpenseId: null,
    loanId: null,
    periodId: 'period_1',
    createdAt: STAMP,
    updatedAt: STAMP,
  }
}

const DAY = [
  tx('expense', 'EXPENSE', 104_900),
  tx('income', 'INCOME', 500_000),
  tx('transfer', 'TRANSFER', 838_675),
]

describe('transfers in the movements list', () => {
  it('are left out of the day subtotals', () => {
    expect(groupByDay(DAY)).toMatchObject([{ spent: 104_900, earned: 500_000 }])
  })

  it('show under "all" and "transfers", never under income or expense', () => {
    expect(countByDirection(DAY)).toEqual({ all: 3, income: 1, expense: 1, transfer: 1 })
    const transfer = DAY[2]
    expect(matchesDirection(transfer, 'all')).toBe(true)
    expect(matchesDirection(transfer, 'transfer')).toBe(true)
    expect(matchesDirection(transfer, 'income')).toBe(false)
    expect(matchesDirection(transfer, 'expense')).toBe(false)
    expect(DAY.filter(item => matchesDirection(item, 'transfer'))).toEqual([transfer])
  })
})

describe('transfers and the search / category filters', () => {
  const label = (category: string) => (category === 'OTHER' ? 'Otros' : 'Comida')
  const transfer = DAY[2]

  it('never match a category filter, not even OTHER', () => {
    expect(matchesSearchAndCategory(transfer, { query: '', category: 'OTHER' }, label)).toBe(false)
    expect(categoriesOf(DAY)).toEqual(['FOOD'])
  })

  it('are found by their label and account names, not by "Otros"', () => {
    const search = (query: string) =>
      matchesSearchAndCategory(transfer, { query, category: '' }, label, 'Transferencia')
    expect(search('transfer')).toBe(true)
    expect(search('visa')).toBe(true)
    expect(search('bancolombia')).toBe(true)
    expect(search('otros')).toBe(false)
  })
})
