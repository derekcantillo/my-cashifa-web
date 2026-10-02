import { addDaysToDateKey, daysBetweenDateKeys, toDateInputValue } from '@/lib/format'
import type { Goal, GoalContribution } from '@/types'

/**
 * Goal arithmetic shared by Home, the goals list and the goal detail. Months remaining
 * and the required monthly contribution are NOT here: they come from the backend
 * (`goal.plan`). Days are Bogotá calendar days; for pace averages a month is 30.44 days.
 */
const DAYS_PER_MONTH = 30.44

/** How many months back "current pace" looks. */
export const PACE_WINDOW_MONTHS = 3

/** Projections further out than this are not shown: they say nothing useful. */
const MAX_PROJECTION_MONTHS = 120

/**
 * Progress as a 0–100 percentage, clamped. The one helper for every goal (and loan)
 * progress bar and label.
 */
export function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.max(0, (current / target) * 100))
}

/**
 * The percentage shown as text: rounded down, so a goal never reads "100%" before it's
 * actually reached. Pass to `formatPercent(value / 100)`.
 */
export function displayPercent(current: number, target: number): number {
  return Math.floor(progressPercent(current, target))
}

/**
 * Sum of the monthly contributions the backend plans for the given goals — the same
 * total the SAVINGS_TARGET_AT_RISK alert compares against (overdue goals count with
 * their whole remaining amount; goals without a plan, i.e. not ACTIVE, add nothing).
 * Months and amounts are never computed here: they come from `goal.plan`.
 */
export function totalRequiredMonthly(goals: readonly Pick<Goal, 'plan'>[]): number {
  return goals.reduce((sum, goal) => sum + (goal.plan?.requiredMonthlyContribution ?? 0), 0)
}

export interface SeriesPoint {
  /** `YYYY-MM-DD`, Bogotá. */
  dateKey: string
  /** Saved amount at the end of that day. */
  amount: number
}

/**
 * Cumulative saved amount, one point per day with contributions (same-day ones are
 * merged), oldest first — retroactive contributions land where their date says, not
 * where they were typed. A goal can be created with an initial `currentAmount` that
 * isn't a contribution; that offset counts from the goal's creation day. The series
 * ends at `currentAmount`.
 */
export function savingsSeries(
  goal: Pick<Goal, 'currentAmount' | 'createdAt'> & {
    contributions: readonly Pick<GoalContribution, 'amount' | 'contributedAt'>[]
  },
): SeriesPoint[] {
  const contributed = goal.contributions.reduce((sum, item) => sum + item.amount, 0)
  const offset = Math.max(0, goal.currentAmount - contributed)

  const byDay = new Map<string, number>()
  const add = (dateKey: string, amount: number) =>
    byDay.set(dateKey, (byDay.get(dateKey) ?? 0) + amount)
  for (const contribution of goal.contributions) {
    add(toDateInputValue(contribution.contributedAt), contribution.amount)
  }
  if (offset > 0) add(toDateInputValue(goal.createdAt), offset)

  let running = 0
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, amount]) => {
      running += amount
      return { dateKey, amount: running }
    })
}

/**
 * Day the series first reached the target (when a contribution completed the goal),
 * or `null` if it never did through contributions.
 */
export function reachedOn(series: readonly SeriesPoint[], targetAmount: number): string | null {
  return series.find(point => point.amount >= targetAmount)?.dateKey ?? null
}

export interface Pace {
  /** Average saved per month over the window. */
  monthly: number
  /** Months the average was taken over (≤ `PACE_WINDOW_MONTHS`). */
  months: number
}

/**
 * Current pace: contributions of the last three months, averaged per month. When the
 * goal's contribution history is younger than that, the average covers only the time
 * since its first contribution (at least one month), so two contributions last week
 * don't read as a monthly habit three times smaller. `null` without at least two
 * contributions in the window — one data point isn't a pace.
 */
export function currentPace(
  contributions: readonly Pick<GoalContribution, 'amount' | 'contributedAt'>[],
  now = new Date(),
): Pace | null {
  const today = toDateInputValue(now)
  const windowStart = addDaysToDateKey(today, -Math.round(PACE_WINDOW_MONTHS * DAYS_PER_MONTH))
  const inWindow = contributions.filter(item => {
    const key = toDateInputValue(item.contributedAt)
    return key > windowStart && key <= today
  })
  if (inWindow.length < 2) return null

  const firstKey = contributions
    .map(item => toDateInputValue(item.contributedAt))
    .reduce((min, key) => (key < min ? key : min))
  const historyMonths = daysBetweenDateKeys(firstKey, today) / DAYS_PER_MONTH
  const months = Math.min(PACE_WINDOW_MONTHS, Math.max(1, historyMonths))
  const total = inWindow.reduce((sum, item) => sum + item.amount, 0)
  return { monthly: total / months, months }
}

/**
 * When the goal would be reached at `monthlyPace`, as a `YYYY-MM-DD` day; `null` when
 * the pace is zero, nothing is left, or it would take more than ten years.
 */
export function projectedReachDate(
  remaining: number,
  monthlyPace: number,
  now = new Date(),
): string | null {
  if (remaining <= 0 || monthlyPace <= 0) return null
  const months = remaining / monthlyPace
  if (months > MAX_PROJECTION_MONTHS) return null
  return addDaysToDateKey(toDateInputValue(now), Math.ceil(months * DAYS_PER_MONTH))
}
