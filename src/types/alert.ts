// Mirrors IAlertResponse (backend alerts module).
export type AlertType =
  | 'BUDGET_70'
  | 'BUDGET_90'
  | 'BUDGET_100'
  | 'LARGE_EXPENSE'
  | 'SAVING_REMINDER'
  | 'WEEKLY_SUMMARY'
  | 'MONTHLY_REPORT'
  | 'GOAL_PROGRESS'
  | 'RECURRING_EXPENSE_DUE'
  | 'SAVINGS_TARGET_AT_RISK'
  | 'PERIOD_DEFICIT'

export interface Alert {
  id: string
  type: AlertType
  /** Built by the backend in Spanish. */
  message: string
  read: boolean
  sentAt: string
}
