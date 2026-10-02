import {
  addDaysToDateKey,
  dateKeyToDate,
  daysBetweenDateKeys,
  toDateInputValue,
} from '@/lib/format'
import type { FinancialPeriod } from '@/types'

export interface PeriodTiming {
  /** First day of the period (`YYYY-MM-DD`, Bogotá). */
  startKey: string
  /** Today for the open period; the last day (`endDate` − 1) for a closed one. */
  lastKey: string
  /** Days counted so far, both ends included — "día N" of the open period. Never below 1. */
  elapsedDays: number
  isOpen: boolean
}

/**
 * Calendar position of a period in Bogotá time. The open period has no end date: it
 * ends with the next salary, so only the elapsed days are known.
 */
export function getPeriodTiming(
  period: Pick<FinancialPeriod, 'startDate' | 'endDate'>,
  now = new Date(),
): PeriodTiming {
  const startKey = toDateInputValue(period.startDate)
  const isOpen = period.endDate === null
  const lastKey = period.endDate
    ? addDaysToDateKey(toDateInputValue(period.endDate), -1)
    : toDateInputValue(now)
  return {
    startKey,
    lastKey,
    elapsedDays: Math.max(1, daysBetweenDateKeys(startKey, lastKey) + 1),
    isOpen,
  }
}

/**
 * The period a `YYYY-MM-DD` day (Bogotá) belongs to — the one the backend will assign
 * a movement dated that day to (`[startDate, endDate)`, `endDate` null = open).
 */
export function findPeriodForDateKey<T extends Pick<FinancialPeriod, 'startDate' | 'endDate'>>(
  periods: readonly T[],
  dateKey: string,
): T | undefined {
  const instant = dateKeyToDate(dateKey).getTime()
  return periods.find(
    period =>
      Date.parse(period.startDate) <= instant &&
      (period.endDate === null || instant < Date.parse(period.endDate)),
  )
}
