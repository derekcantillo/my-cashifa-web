import { describe, expect, it, vi } from 'vitest'

import { formatShare } from '@/lib/format'

import {
  assetAccounts,
  buildAssetComposition,
  formatAsOfDate,
  reconcile,
  roundShares,
  shareForDisplay,
} from './netWorthView'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

const assets = (accountsBalance: number, receivables: number) => ({
  accountsBalance,
  receivables,
})

describe('asset composition', () => {
  it('ranks groups by amount and colors them by rank', () => {
    const { items, total, showBar } = buildAssetComposition(assets(1_000, 3_000))
    expect(showBar).toBe(true)
    expect(total).toBe(4_000)
    expect(items.map(item => [item.group, item.rank, item.fillClass])).toEqual([
      ['receivables', 1, 'bg-chart-1'],
      ['accounts', 2, 'bg-chart-2'],
    ])
  })

  it('keeps the backend order on ties', () => {
    const { items } = buildAssetComposition(assets(500, 500))
    expect(items.map(item => item.group)).toEqual(['accounts', 'receivables'])
  })

  it('has no goals group: goal money is already inside the accounts', () => {
    const { items } = buildAssetComposition(assets(5_000_000, 0))
    expect(items.map(item => [item.group, item.amount])).toEqual([['accounts', 5_000_000]])
  })

  it('drops zero groups from the bar and the legend', () => {
    const { items, showBar } = buildAssetComposition(assets(14_812_431.56, 0))
    expect(showBar).toBe(true)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ group: 'accounts', percent: 100, displayPercent: 100 })
  })

  it('shows no bar when assets add up to 0', () => {
    expect(buildAssetComposition(assets(0, 0))).toEqual({ items: [], total: 0, showBar: false })
  })

  it('shows no bar (nor shares or colors) when a group is negative', () => {
    const { items, showBar } = buildAssetComposition(assets(-200_000, 500_000))
    expect(showBar).toBe(false)
    expect(items.map(item => [item.group, item.percent, item.fillClass])).toEqual([
      ['receivables', null, null],
      ['accounts', null, null],
    ])
  })

  it('reads "<1%" for a real but tiny share', () => {
    const { items } = buildAssetComposition(assets(9_960_000, 40_000))
    expect(items.map(item => item.displayPercent)).toEqual([100, 0])
    expect(items.map(item => formatShare(shareForDisplay(item), 'es-CO'))).toEqual(['100%', '<1%'])
  })
})

describe('asset accounts', () => {
  it('leaves credit cards out, like the backend does with accountsBalance', () => {
    const accounts = [
      { id: 'a1', type: 'DEBIT_CARD' as const },
      { id: 'a2', type: 'CREDIT_CARD' as const },
      { id: 'a3', type: 'SAVINGS_ACCOUNT' as const },
      { id: 'a4', type: 'CASH' as const },
    ]
    expect(assetAccounts(accounts).map(account => account.id)).toEqual(['a1', 'a3', 'a4'])
  })

  it('keeps an empty list empty', () => {
    expect(assetAccounts([])).toEqual([])
  })
})

describe('rounded shares', () => {
  it('add up to 100', () => {
    expect(roundShares([33.34, 33.33, 33.33])).toEqual([34, 33, 33])
    expect(roundShares([50.5, 49.5])).toEqual([51, 49])
    // Rounding each alone would give 13 + 13 + 75 = 101.
    expect(roundShares([12.5, 12.5, 75])).toEqual([13, 12, 75])
  })
})

describe('reconciliation', () => {
  it('matches when rows add up to the subtotal, ignoring float noise', () => {
    expect(reconcile(14_812_431.56, [14_810_463.22, 1_968.34, 0]).matches).toBe(true)
    expect(reconcile(0.3, [0.1, 0.2]).matches).toBe(true)
  })

  it('reports the difference otherwise', () => {
    expect(reconcile(1_000, [600, 300])).toEqual({
      rowsTotal: 900,
      difference: 100,
      matches: false,
    })
    expect(reconcile(0, []).matches).toBe(true)
  })
})

describe('as-of date', () => {
  it("uses Bogotá's calendar day", () => {
    // 03:00 UTC on Oct 6 is still Oct 5 in Bogotá (UTC−5).
    expect(formatAsOfDate(new Date('2026-10-06T03:00:00Z'), 'es-CO')).toBe('5 de octubre de 2026')
    expect(formatAsOfDate(new Date('2026-10-06T05:00:00Z'), 'es-CO')).toBe('6 de octubre de 2026')
    expect(formatAsOfDate(new Date('2026-10-06T03:00:00Z'), 'en-US')).toBe('October 5, 2026')
  })
})
