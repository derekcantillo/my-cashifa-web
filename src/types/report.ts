import type { Category } from './category'

// Mirrors the backend reports module (report-response.interface.ts).
// Income/expense totals for a period live in PeriodLedger, not here.
export interface ReportSummary {
  biggestExpense: { category: Category; amount: number } | null
  savingsProgress: {
    actual: number
    planned: number
    /** `actual / planned * 100`, one decimal; 0 when `planned` is 0. */
    percentage: number
  }
  mostFrequentCategory: { category: Category; count: number } | null
}

export interface DistributionItem {
  category: Category
  amount: number
  /** Share of the period's total EXPENSE. */
  percentage: number
}

/** Cumulative goal contributions over time. */
export interface SavingsProjectionPoint {
  date: string
  cumulativeAmount: number
}

/** Target date of an active goal. */
export interface SavingsProjectionMarker {
  date: string
  label: string
}

export interface SavingsProjection {
  points: SavingsProjectionPoint[]
  markers: SavingsProjectionMarker[]
}
