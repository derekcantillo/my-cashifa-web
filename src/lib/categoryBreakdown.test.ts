import { describe, expect, it } from 'vitest'

import type { Category } from '@/types'

import { buildCategoryBreakdown } from './categoryBreakdown'

const item = (category: Category, amount: number) => ({ category, amount })

describe('category breakdown (color by position)', () => {
  it('ranks by amount and colors by rank; no "Otras" under five categories', () => {
    const result = buildCategoryBreakdown([
      item('FOOD', 100),
      item('HOUSING', 700),
      item('HEALTH', 200),
    ])
    expect(result.items.map(i => [i.category, i.rank, i.fillClass])).toEqual([
      ['HOUSING', 1, 'bg-chart-1'],
      ['HEALTH', 2, 'bg-chart-2'],
      ['FOOD', 3, 'bg-chart-3'],
    ])
    expect(result.items.map(i => i.percent)).toEqual([70, 20, 10])
    expect(result.others).toBeNull()
    expect(result.total).toBe(1000)
  })

  it('exactly five: all ranked, still no "Otras"', () => {
    const result = buildCategoryBreakdown(
      (['FOOD', 'HOUSING', 'HEALTH', 'DEBT', 'TAXES'] as const).map((c, i) => item(c, 100 - i)),
    )
    expect(result.items).toHaveLength(5)
    expect(result.items[4].fillClass).toBe('bg-chart-5')
    expect(result.others).toBeNull()
  })

  it('more than five: the rest fold into "Otras" with their sum and share', () => {
    const result = buildCategoryBreakdown([
      item('HOUSING', 500),
      item('FOOD', 200),
      item('HEALTH', 100),
      item('DEBT', 80),
      item('TAXES', 60),
      item('TRANSPORT', 40),
      item('OTHER', 20),
    ])
    expect(result.items).toHaveLength(5)
    expect(result.others).toEqual({
      amount: 60,
      percent: 6,
      categories: [
        { category: 'TRANSPORT', amount: 40, percent: 4 },
        { category: 'OTHER', amount: 20, percent: 2 },
      ],
    })
    const sum = result.items.reduce((s, i) => s + i.percent, 0) + (result.others?.percent ?? 0)
    expect(sum).toBeCloseTo(100)
  })

  it('breaks ties by category key, whatever the input order', () => {
    const a = buildCategoryBreakdown([item('TAXES', 50), item('FOOD', 50), item('DEBT', 50)])
    const b = buildCategoryBreakdown([item('DEBT', 50), item('TAXES', 50), item('FOOD', 50)])
    expect(a.items.map(i => i.category)).toEqual(['DEBT', 'FOOD', 'TAXES'])
    expect(b.items).toEqual(a.items)
  })

  it('drops zero amounts and returns empty for a zero total', () => {
    expect(buildCategoryBreakdown([item('FOOD', 0), item('HOUSING', 10)]).items).toHaveLength(1)
    expect(buildCategoryBreakdown([item('FOOD', 0)])).toEqual({ items: [], others: null, total: 0 })
    expect(buildCategoryBreakdown([])).toEqual({ items: [], others: null, total: 0 })
  })

  it('keeps tiny shares as real numbers (shown as "<1%")', () => {
    const result = buildCategoryBreakdown([item('HOUSING', 995), item('FOOD', 5)])
    expect(result.items[1].percent).toBeCloseTo(0.5)
  })
})
