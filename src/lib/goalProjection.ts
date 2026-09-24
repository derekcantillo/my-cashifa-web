import type { Goal } from '@/types'

export interface ProgressPoint {
  /** Epoch ms. */
  time: number
  amount: number
}

export interface GoalProjection {
  /** Cumulative saved amount over time; the last point equals `currentAmount`. */
  actual: ProgressPoint[]
  /** Straight line from the last actual point; `null` when there isn't enough data. */
  projected: [ProgressPoint, ProgressPoint] | null
  /** Average contribution per month over the window used for the projection. */
  monthlyRate: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const AVG_MONTH_DAYS = 30.44
/** How many of the latest contributions the average looks at. */
const RATE_WINDOW = 6

/**
 * Builds the actual savings curve and a simple linear projection.
 *
 * - Actual: contributions sorted by `contributedAt`, accumulated. A goal can be created
 *   with a starting `currentAmount` that isn't a contribution, so the curve starts
 *   from that offset and always ends at `currentAmount`.
 * - Projected (only with a target date and ≥ 2 contributions on different days):
 *   the average daily pace of the latest contributions, extended from the last
 *   contribution until the target date or the target amount, whichever comes first.
 */
export function buildGoalProjection(goal: Goal): GoalProjection {
  const contributions = [...goal.contributions].sort((a, b) =>
    a.contributedAt.localeCompare(b.contributedAt),
  )
  const contributed = contributions.reduce((sum, c) => sum + c.amount, 0)
  const offset = Math.max(0, goal.currentAmount - contributed)

  const actual: ProgressPoint[] = []
  let running = offset
  for (const contribution of contributions) {
    running += contribution.amount
    actual.push({ time: Date.parse(contribution.contributedAt), amount: running })
  }

  const empty = { actual, projected: null, monthlyRate: null }
  if (contributions.length < 2) return empty

  const window = contributions.slice(-RATE_WINDOW)
  const spanDays =
    (Date.parse(window[window.length - 1].contributedAt) - Date.parse(window[0].contributedAt)) /
    DAY_MS
  if (spanDays <= 0) return empty
  // The first contribution of the window only marks the start of the span.
  const dailyRate = window.slice(1).reduce((sum, c) => sum + c.amount, 0) / spanDays
  const monthlyRate = dailyRate * AVG_MONTH_DAYS

  const last = actual[actual.length - 1]
  const targetTime = Date.parse(goal.targetDate)
  const remaining = goal.targetAmount - last.amount
  if (dailyRate <= 0 || remaining <= 0 || targetTime <= last.time) {
    return { ...empty, monthlyRate }
  }

  const reachTime = last.time + (remaining / dailyRate) * DAY_MS
  const endTime = Math.min(targetTime, reachTime)
  const endAmount = Math.min(
    goal.targetAmount,
    last.amount + ((endTime - last.time) / DAY_MS) * dailyRate,
  )

  return { actual, projected: [last, { time: endTime, amount: endAmount }], monthlyRate }
}
