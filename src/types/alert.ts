// Mirrors IAlertResponse (backend alerts module) and the `AlertType` enum.
export const ALERT_TYPES = [
  'BUDGET_70',
  'BUDGET_90',
  'BUDGET_100',
  'LARGE_EXPENSE',
  'SAVING_REMINDER',
  'WEEKLY_SUMMARY',
  'MONTHLY_REPORT',
  'GOAL_PROGRESS',
  'RECURRING_EXPENSE_DUE',
  'SAVINGS_TARGET_AT_RISK',
  'PERIOD_DEFICIT',
] as const

export type AlertType = (typeof ALERT_TYPES)[number]

export interface Alert {
  id: string
  /** A type the web doesn't know yet arrives as-is: render it as a generic notice. */
  type: AlertType | (string & {})
  /** Built by the backend in Spanish. */
  message: string
  read: boolean
  sentAt: string
}
