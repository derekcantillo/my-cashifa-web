import { describe, expect, it, vi } from 'vitest'

import type { TransactionType } from '@/types'

import {
  dailySpendingSeries,
  hasFixedSpending,
  spendingByDay,
  splitFixedSpending,
} from './dailySpending'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

const tx = (
  type: TransactionType,
  amount: number,
  transactionDate: string,
  recurringExpenseId: string | null = null,
) => ({ type, amount, transactionDate, recurringExpenseId })

describe('daily spending in Bogotá time', () => {
  it('groups by Bogotá day, not UTC', () => {
    const byDay = spendingByDay([
      tx('EXPENSE', 100, '2026-09-29T17:00:00.000Z'),
      // 22:30 Bogotá on Sep 29 is already Sep 30 in UTC.
      tx('EXPENSE', 50, '2026-09-30T03:30:00.000Z'),
      // 00:30 Bogotá on Sep 30.
      tx('DEBT_PAYMENT', 20, '2026-09-30T05:30:00.000Z'),
    ])
    expect(Object.fromEntries(byDay)).toEqual({ '2026-09-29': 150, '2026-09-30': 20 })
  })

  it('counts only money going out', () => {
    const byDay = spendingByDay([
      tx('INCOME', 1000, '2026-09-29T17:00:00.000Z'),
      tx('SAVING', 300, '2026-09-29T17:00:00.000Z'),
      tx('LOAN_REPAYMENT', 300, '2026-09-29T17:00:00.000Z'),
      tx('EXPENSE', 10, '2026-09-29T17:00:00.000Z'),
    ])
    expect(byDay.get('2026-09-29')).toBe(10)
  })

  it('fills every day of the period with zeros', () => {
    const series = dailySpendingSeries([tx('EXPENSE', 10, '2026-09-30T17:00:00.000Z')], {
      startKey: '2026-09-29',
      lastKey: '2026-10-02',
    })
    expect(series).toEqual([
      { dateKey: '2026-09-29', amount: 0 },
      { dateKey: '2026-09-30', amount: 10 },
      { dateKey: '2026-10-01', amount: 0 },
      { dateKey: '2026-10-02', amount: 0 },
    ])
  })
})

describe('fixed vs variable spending', () => {
  it('splits by the link to a recurring expense', () => {
    expect(
      splitFixedSpending([
        tx('EXPENSE', 1650, '2026-09-29T17:00:00.000Z', 'rent'),
        tx('DEBT_PAYMENT', 300, '2026-09-29T17:00:00.000Z', 'card'),
        tx('EXPENSE', 50, '2026-09-29T17:00:00.000Z'),
        tx('INCOME', 9000, '2026-09-29T17:00:00.000Z'),
      ]),
    ).toEqual({ fixed: 1950, variable: 50, total: 2000 })
  })

  it('is all zeros without spending', () => {
    expect(splitFixedSpending([tx('INCOME', 10, '2026-09-29T17:00:00.000Z')])).toEqual({
      fixed: 0,
      variable: 0,
      total: 0,
    })
  })
})

describe('variable spending by day', () => {
  const transactions = [
    tx('EXPENSE', 1650, '2026-09-29T17:00:00.000Z', 'rent'),
    tx('EXPENSE', 50, '2026-09-29T17:00:00.000Z'),
    tx('EXPENSE', 30, '2026-09-30T17:00:00.000Z'),
  ]

  it('leaves out spending linked to a recurring expense', () => {
    expect(Object.fromEntries(spendingByDay(transactions, { variableOnly: true }))).toEqual({
      '2026-09-29': 50,
      '2026-09-30': 30,
    })
    expect(spendingByDay(transactions).get('2026-09-29')).toBe(1700)
  })

  it('knows when there is fixed spending at all', () => {
    expect(hasFixedSpending(transactions)).toBe(true)
    expect(hasFixedSpending(transactions.slice(1))).toBe(false)
    // A linked income doesn't make spending "fixed".
    expect(hasFixedSpending([tx('INCOME', 10, '2026-09-29T17:00:00.000Z', 'x')])).toBe(false)
  })
})
