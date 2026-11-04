import { formatDate } from '@/lib/format'
import type { Account, NetWorth } from '@/types'

/**
 * The asset groups of GET /net-worth. Goals aren't one: their money already sits in the
 * accounts (an informative earmark). A card's debt is a liability, not a negative asset.
 */
export const ASSET_GROUPS = ['accounts', 'receivables'] as const
export type AssetGroup = (typeof ASSET_GROUPS)[number]

/** Background class per rank (1-based) — literal strings so Tailwind sees them. */
const RANK_FILL = ['bg-chart-1', 'bg-chart-2'] as const

export function assetAmounts(assets: NetWorth['assets']): Record<AssetGroup, number> {
  return {
    accounts: assets.accountsBalance,
    receivables: assets.receivables,
  }
}

/**
 * The rows behind `accountsBalance`: every account except credit cards, plus a
 * configured card with money in favour (a positive balance is an asset). Cards with
 * debt are liabilities; cards without a limit stay out (`info.unconfiguredCards`).
 */
export function assetAccounts<T extends Pick<Account, 'type' | 'currentBalance' | 'creditCard'>>(
  accounts: readonly T[],
): T[] {
  return accounts.filter(
    account =>
      account.type !== 'CREDIT_CARD' ||
      (account.creditCard?.configured === true && account.currentBalance > 0),
  )
}

/** Configured cards, the rows behind `liabilities.creditCardsDebt`; most owed first. */
export function liabilityCards<T extends Pick<Account, 'type' | 'creditCard'>>(
  accounts: readonly T[],
): T[] {
  return accounts
    .filter(account => account.type === 'CREDIT_CARD' && account.creditCard?.configured === true)
    .sort((a, b) => (b.creditCard?.debt ?? 0) - (a.creditCard?.debt ?? 0))
}

export interface CompositionItem {
  group: AssetGroup
  amount: number
  /** Exact share of the total (0–100); `null` when shares make no sense (see `showBar`). */
  percent: number | null
  /** Whole-number share for display; they add up to 100. `null` like `percent`. */
  displayPercent: number | null
  /** 1 = biggest; colors go by rank. */
  rank: number
  /** `bg-chart-<rank>`; `null` when there's no bar to match. */
  fillClass: string | null
}

export interface AssetComposition {
  /** Groups with a non-zero amount, biggest first (ties keep the backend's order). */
  items: CompositionItem[]
  total: number
  /**
   * The bar only makes sense as parts of a positive whole: hidden when the assets add up
   * to 0 or any group is negative (an overdrawn account can make `accounts` < 0); the
   * legend then shows amounts without shares or colors.
   */
  showBar: boolean
}

/**
 * Whole-number shares that add up to exactly 100 (largest remainder): rounding each one
 * alone can show 99% or 101% in total. Ties go to the earlier (bigger) item.
 */
export function roundShares(percents: readonly number[]): number[] {
  const floors = percents.map(Math.floor)
  let missing = 100 - floors.reduce((sum, value) => sum + value, 0)
  const byRemainder = percents
    .map((percent, index) => ({ index, remainder: percent - Math.floor(percent) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  for (const { index } of byRemainder) {
    if (missing <= 0) break
    floors[index] += 1
    missing -= 1
  }
  return floors
}

export function buildAssetComposition(assets: NetWorth['assets']): AssetComposition {
  const amounts = assetAmounts(assets)
  const nonZero = ASSET_GROUPS.map(group => ({ group, amount: amounts[group] }))
    .filter(item => item.amount !== 0)
    .sort((a, b) => b.amount - a.amount)
  const total = nonZero.reduce((sum, item) => sum + item.amount, 0)
  const showBar = total > 0 && nonZero.every(item => item.amount > 0)

  const percents = showBar ? nonZero.map(item => (item.amount / total) * 100) : []
  const rounded = showBar ? roundShares(percents) : []

  return {
    items: nonZero.map((item, index) => ({
      ...item,
      percent: showBar ? percents[index] : null,
      displayPercent: showBar ? rounded[index] : null,
      rank: index + 1,
      fillClass: showBar ? RANK_FILL[index] : null,
    })),
    total,
    showBar,
  }
}

/**
 * What `formatShare` should get for a group: the rounded share, except that a real
 * amount rounded down to 0 keeps its exact value, so it reads "<1%" rather than "0%".
 */
export function shareForDisplay(item: Pick<CompositionItem, 'percent' | 'displayPercent'>): number {
  if (item.percent === null || item.displayPercent === null) return 0
  return item.displayPercent === 0 ? item.percent : item.displayPercent
}

export interface Reconciliation {
  rowsTotal: number
  /** Backend subtotal minus the rows' sum. */
  difference: number
  matches: boolean
}

/**
 * The section subtotals come from GET /net-worth (the source of truth) and the rows from
 * the lists; they're cached separately and may be fetched at different moments. Cents
 * of float noise don't count as a mismatch.
 */
export function reconcile(subtotal: number, rows: readonly number[]): Reconciliation {
  const rowsTotal = rows.reduce((sum, value) => sum + value, 0)
  const difference = subtotal - rowsTotal
  return { rowsTotal, difference, matches: Math.abs(difference) < 0.005 }
}

/** "5 de octubre de 2026" / "October 5, 2026": today's date in Bogotá. */
export function formatAsOfDate(now: Date, locale: string): string {
  return formatDate(now, { locale, day: 'numeric', month: 'long', year: 'numeric' })
}
