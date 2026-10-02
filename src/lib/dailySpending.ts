import { addDaysToDateKey, daysBetweenDateKeys, toDateInputValue } from '@/lib/format'
import type { PeriodTiming } from '@/lib/periodTiming'
import { getTransactionDirection } from '@/lib/transactionDirection'
import type { Transaction } from '@/types'

/**
 * "Spending" everywhere in the app is money going out — EXPENSE and DEBT_PAYMENT —
 * the ledger's definition of `expenses`.
 */
function isSpending(transaction: Pick<Transaction, 'type'>): boolean {
  return getTransactionDirection(transaction.type) === 'out'
}

type SpendingTransaction = Pick<Transaction, 'type' | 'amount' | 'transactionDate'> &
  Partial<Pick<Transaction, 'recurringExpenseId'>>

export interface SpendingOptions {
  /** Leave out spending linked to a recurring expense (variable spending only). */
  variableOnly?: boolean
}

/** Spending per Bogotá calendar day (`YYYY-MM-DD` → amount). */
export function spendingByDay(
  transactions: readonly SpendingTransaction[],
  { variableOnly = false }: SpendingOptions = {},
): Map<string, number> {
  const byDay = new Map<string, number>()
  for (const transaction of transactions) {
    if (!isSpending(transaction)) continue
    if (variableOnly && transaction.recurringExpenseId) continue
    const dateKey = toDateInputValue(transaction.transactionDate)
    byDay.set(dateKey, (byDay.get(dateKey) ?? 0) + transaction.amount)
  }
  return byDay
}

export interface DaySpending {
  dateKey: string
  amount: number
}

/** Every day of the period so far (zeros included), oldest first. */
export function dailySpendingSeries(
  transactions: readonly SpendingTransaction[],
  timing: Pick<PeriodTiming, 'startKey' | 'lastKey'>,
  options: SpendingOptions = {},
): DaySpending[] {
  const byDay = spendingByDay(transactions, options)
  const days = Math.max(0, daysBetweenDateKeys(timing.startKey, timing.lastKey)) + 1
  return Array.from({ length: days }, (_, index) => {
    const dateKey = addDaysToDateKey(timing.startKey, index)
    return { dateKey, amount: byDay.get(dateKey) ?? 0 }
  })
}

export interface FixedSplit {
  /** Spending linked to a recurring expense (`recurringExpenseId`). */
  fixed: number
  variable: number
  total: number
}

/** Whether any spending is linked to a recurring expense (fixed vs variable makes sense). */
export function hasFixedSpending(
  transactions: readonly Pick<Transaction, 'type' | 'recurringExpenseId'>[],
): boolean {
  return transactions.some(transaction => isSpending(transaction) && transaction.recurringExpenseId)
}

/** Fixed vs variable spending: what is linked to a recurring expense vs the rest. */
export function splitFixedSpending(
  transactions: readonly Pick<Transaction, 'type' | 'amount' | 'recurringExpenseId'>[],
): FixedSplit {
  let fixed = 0
  let total = 0
  for (const transaction of transactions) {
    if (!isSpending(transaction)) continue
    total += transaction.amount
    if (transaction.recurringExpenseId) fixed += transaction.amount
  }
  return { fixed, variable: total - fixed, total }
}
