import { addDaysToDateKey, toDateInputValue } from '@/lib/format'
import type { PeriodTiming } from '@/lib/periodTiming'
import { spendingByDay } from '@/lib/dailySpending'
import type { Transaction } from '@/types'

export const PACE_DAYS = 7

export interface PaceDay {
  /** `YYYY-MM-DD`, Bogotá. */
  dateKey: string
  amount: number
  /** False for the days before the period started (drawn as flat, empty bars). */
  inPeriod: boolean
  isToday: boolean
}

export interface SpendingPace {
  /** The last `PACE_DAYS` calendar days of the period, oldest first. */
  days: PaceDay[]
  /** Highest daily amount among `days` (scales the bars); 0 when nothing was spent. */
  maxAmount: number
  /** Everything spent in the period. */
  total: number
  /** `total / elapsedDays`. */
  dailyAverage: number
  /** The day with the most spending in the whole period, or `null` if nothing was spent. */
  peak: { dateKey: string; amount: number } | null
}

/**
 * Daily spending of a period. "Spending" is the money going out — EXPENSE and
 * DEBT_PAYMENT — the same definition as the ledger's `expenses` and the budgets'
 * `spentAmount`, so the average matches the "Gastos del periodo" stat.
 */
export function buildSpendingPace(
  transactions: readonly Transaction[],
  timing: PeriodTiming,
  now = new Date(),
): SpendingPace {
  const byDay = spendingByDay(transactions)
  const total = [...byDay.values()].reduce((sum, amount) => sum + amount, 0)

  const todayKey = toDateInputValue(now)
  const days: PaceDay[] = Array.from({ length: PACE_DAYS }, (_, index) => {
    const dateKey = addDaysToDateKey(timing.lastKey, index - (PACE_DAYS - 1))
    return {
      dateKey,
      amount: byDay.get(dateKey) ?? 0,
      // `YYYY-MM-DD` strings compare chronologically.
      inPeriod: dateKey >= timing.startKey,
      isToday: timing.isOpen && dateKey === todayKey,
    }
  })

  let peak: SpendingPace['peak'] = null
  for (const [dateKey, amount] of byDay) {
    if (amount > 0 && (!peak || amount > peak.amount)) peak = { dateKey, amount }
  }

  return {
    days,
    maxAmount: Math.max(0, ...days.map(day => day.amount)),
    total,
    dailyAverage: total / timing.elapsedDays,
    peak,
  }
}
