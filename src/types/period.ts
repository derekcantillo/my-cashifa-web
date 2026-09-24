// Mirrors IFinancialPeriodResponse and IPeriodLedgerResponse (backend).
// A period runs salary to salary: `[startDate, endDate)`.
export interface FinancialPeriod {
  id: string
  /** e.g. `28 ago 2026 – 27 sep 2026`, or `28 ago 2026 – en curso`. Built by the backend in Spanish. */
  label: string
  /** ISO datetime — Bogotá midnight of the salary day. */
  startDate: string
  /** Exclusive: the start of the next period. `null` while the period is open. */
  endDate: string | null
  /** Derived in the mapper: the open period (`endDate === null`) is the current one. */
  isCurrent: boolean
}

/** Rolling balance of a period (GET /period-ledger). Opening/closing balances live here, not on the period. */
export interface PeriodLedger {
  id: string
  periodId: string
  periodLabel: string
  /** Previous period's `closingBalance` (the rollover). */
  openingBalance: number
  income: number
  expenses: number
  savings: number
  closingBalance: number
  availableToSpend: number
}
