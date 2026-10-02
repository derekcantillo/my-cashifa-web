import type { TFunction } from 'i18next'

import type { Goal } from '@/types'

/** Closest target date first (every goal has one: `targetDate` is required). */
export function byTargetDate(a: Goal, b: Goal): number {
  return a.targetDate.localeCompare(b.targetDate)
}

export interface GoalGroups {
  /** ACTIVE and PAUSED, by target date. */
  inProgress: Goal[]
  active: Goal[]
  completed: Goal[]
}

export function groupGoals(goals: readonly Goal[]): GoalGroups {
  const sorted = [...goals].sort(byTargetDate)
  return {
    inProgress: sorted.filter(goal => goal.status !== 'COMPLETED'),
    active: sorted.filter(goal => goal.status === 'ACTIVE'),
    completed: sorted.filter(goal => goal.status === 'COMPLETED'),
  }
}

/** Shown when no (valid) goal is in the URL: the first active one, else anything in progress, else the first completed. */
export function defaultGoal(groups: GoalGroups): Goal | undefined {
  return groups.active[0] ?? groups.inProgress[0] ?? groups.completed[0]
}

/**
 * "faltan 3 meses" / "Fecha vencida" from the backend plan (whole calendar months).
 * `null` for goals without a plan (paused, completed): they only show the date.
 */
export function timeLeftLabel(t: TFunction<'goals'>, goal: Pick<Goal, 'plan'>): string | null {
  if (!goal.plan) return null
  if (goal.plan.isOverdue) return t('list.overdue')
  return t('list.monthsLeft', { count: goal.plan.monthsRemaining })
}
