import type { TFunction } from 'i18next'

import { formatNumber } from '@/lib/format'
import { timeLeft } from '@/lib/goalMath'
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

/** "faltan 3,3 meses", "falta 1 día", "vence hoy" or "Fecha vencida" (see `timeLeft`). */
export function timeLeftLabel(
  t: TFunction<'goals'>,
  targetDate: string,
  locale: string,
  now = new Date(),
): string {
  const left = timeLeft(targetDate, now)
  switch (left.kind) {
    case 'overdue':
      return t('list.overdue')
    case 'today':
      return t('list.dueToday')
    case 'days':
      return t('list.daysLeft', { count: left.days })
    case 'months':
      return t('list.monthsLeft', {
        count: left.months,
        months: formatNumber(left.months, { locale }),
      })
  }
}
