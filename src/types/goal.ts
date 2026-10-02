// Mirrors IGoalResponse / IGoalContributionResponse (backend goals module).
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED'

export type PlanPhase =
  | 'PHASE_1_DEBT_CONTROL'
  | 'PHASE_2_OPTIMIZATION'
  | 'PHASE_3_VEHICLE_PURCHASE'
  | 'PHASE_4_CONSOLIDATION'

export interface GoalContribution {
  id: string
  /** Not in the API payload — filled in by the mapper from the parent goal. */
  goalId: string
  amount: number
  note: string | null
  contributedAt: string
  createdAt: string
}

/**
 * Contribution plan computed by the backend on every read (`calculateGoalPlan`, the
 * single source also used by the SAVINGS_TARGET_AT_RISK alert). `null` unless ACTIVE.
 */
export interface GoalPlan {
  /** Calendar months to the target date, counted month to month (day ignored). Minimum 1; 0 once overdue. */
  monthsRemaining: number
  /** `ceil(remaining / monthsRemaining)`; the whole remaining amount once overdue. */
  requiredMonthlyContribution: number
  isOverdue: boolean
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  /** `currentAmount / targetAmount * 100`, one decimal. */
  percentage: number
  targetDate: string
  phase: PlanPhase
  status: GoalStatus
  plan: GoalPlan | null
  /** Newest first. */
  contributions: GoalContribution[]
  createdAt: string
  updatedAt: string
}

export interface CreateGoalInput {
  name: string
  targetAmount: number
  currentAmount?: number
  targetDate: string
  phase: PlanPhase
  status?: GoalStatus
}

export type UpdateGoalInput = Partial<CreateGoalInput>

export interface CreateGoalContributionInput {
  amount: number
  note?: string
  /** ISO date; defaults to now on the backend. */
  contributedAt?: string
}
