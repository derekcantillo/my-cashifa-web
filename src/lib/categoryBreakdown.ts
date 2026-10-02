import type { Category } from '@/types'

/** Categories that get their own color; the rest fold into "Otras". */
export const RANKED_CATEGORIES = 5

/** Tailwind background class per rank (1-based) — literal strings so Tailwind sees them. */
const RANK_FILL = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'] as const
export const OTHERS_FILL = 'bg-chart-other'

export interface BreakdownItem {
  category: Category
  amount: number
  /** 0–100, share of the period's total. */
  percent: number
}

export interface RankedItem extends BreakdownItem {
  /** 1 = biggest. */
  rank: number
  /** Background class of its color (`bg-chart-<rank>`). */
  fillClass: string
}

export interface CategoryBreakdown {
  items: RankedItem[]
  /** Everything after the top five; `null` when there are five or fewer categories. */
  others: { amount: number; percent: number; categories: BreakdownItem[] } | null
  total: number
}

/**
 * Colors by POSITION: the five biggest categories of the period take chart-1…chart-5 by
 * rank, the rest go to "Otras" (chart-other). Ties are broken by category key, so the
 * order — and the colors — are stable and identical wherever the same data is shown
 * (Reportes and Gastos). Zero amounts are dropped; a zero total gives an empty breakdown.
 * Percentages are computed here from the amounts (share of their sum).
 */
export function buildCategoryBreakdown(
  distribution: readonly { category: Category; amount: number }[],
): CategoryBreakdown {
  const positive = distribution.filter(item => item.amount > 0)
  const total = positive.reduce((sum, item) => sum + item.amount, 0)
  if (total <= 0) return { items: [], others: null, total: 0 }

  const sorted = [...positive].sort(
    (a, b) => b.amount - a.amount || a.category.localeCompare(b.category),
  )
  const share = (amount: number) => (amount / total) * 100

  const items: RankedItem[] = sorted.slice(0, RANKED_CATEGORIES).map((item, index) => ({
    category: item.category,
    amount: item.amount,
    percent: share(item.amount),
    rank: index + 1,
    fillClass: RANK_FILL[index],
  }))
  const rest = sorted.slice(RANKED_CATEGORIES)
  const othersAmount = rest.reduce((sum, item) => sum + item.amount, 0)

  return {
    items,
    others:
      rest.length > 0
        ? {
            amount: othersAmount,
            percent: share(othersAmount),
            categories: rest.map(item => ({
              category: item.category,
              amount: item.amount,
              percent: share(item.amount),
            })),
          }
        : null,
    total,
  }
}
