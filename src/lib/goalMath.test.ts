import { describe, expect, it, vi } from 'vitest'

import { fromDateInputValue } from './format'
import {
  currentPace,
  displayPercent,
  progressPercent,
  projectedReachDate,
  reachedOn,
  savingsSeries,
  totalRequiredMonthly,
} from './goalMath'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

// 2026-10-01 at 10:30 in Bogotá.
const now = new Date('2026-10-01T15:30:00.000Z')

describe('progress percentage', () => {
  it('clamps to 0–100', () => {
    expect(progressPercent(50, 200)).toBe(25)
    expect(progressPercent(300, 200)).toBe(100)
    expect(progressPercent(-10, 200)).toBe(0)
    expect(progressPercent(10, 0)).toBe(0)
  })

  it('rounds the label down, so it never says 100% early', () => {
    expect(displayPercent(1_995_000, 2_000_000)).toBe(99)
    expect(displayPercent(2_000_000, 2_000_000)).toBe(100)
    expect(displayPercent(1, 3)).toBe(33)
  })
})

describe('savings series', () => {
  const base = { createdAt: '2026-06-01T15:00:00.000Z' }

  it('accumulates in date order, whatever order the API sent', () => {
    const series = savingsSeries({
      ...base,
      currentAmount: 600,
      contributions: [
        { amount: 300, contributedAt: '2026-09-10T17:00:00.000Z' },
        { amount: 100, contributedAt: '2026-07-10T17:00:00.000Z' },
        { amount: 200, contributedAt: '2026-08-10T17:00:00.000Z' },
      ],
    })
    expect(series).toEqual([
      { dateKey: '2026-07-10', amount: 100 },
      { dateKey: '2026-08-10', amount: 300 },
      { dateKey: '2026-09-10', amount: 600 },
    ])
  })

  it('merges contributions of the same Bogotá day', () => {
    const series = savingsSeries({
      ...base,
      currentAmount: 300,
      contributions: [
        { amount: 100, contributedAt: '2026-09-10T13:00:00.000Z' },
        // 23:30 Bogotá on Sep 10 = Sep 11 in UTC: still Sep 10.
        { amount: 200, contributedAt: '2026-09-11T04:30:00.000Z' },
      ],
    })
    expect(series).toEqual([{ dateKey: '2026-09-10', amount: 300 }])
  })

  it('places retroactive contributions before the creation day and counts the initial amount', () => {
    const series = savingsSeries({
      createdAt: '2026-09-01T15:00:00.000Z',
      currentAmount: 1_000, // 700 contributed + 300 entered at creation
      contributions: [
        { amount: 500, contributedAt: '2026-09-20T17:00:00.000Z' },
        { amount: 200, contributedAt: '2026-05-01T17:00:00.000Z' }, // retroactive
      ],
    })
    expect(series).toEqual([
      { dateKey: '2026-05-01', amount: 200 },
      { dateKey: '2026-09-01', amount: 500 },
      { dateKey: '2026-09-20', amount: 1_000 },
    ])
    expect(reachedOn(series, 500)).toBe('2026-09-01')
    expect(reachedOn(series, 2_000)).toBeNull()
  })
})

describe('current pace', () => {
  it('averages the last three months', () => {
    const pace = currentPace(
      [
        { amount: 300, contributedAt: '2026-04-01T17:00:00.000Z' }, // outside the window
        { amount: 300, contributedAt: '2026-08-01T17:00:00.000Z' },
        { amount: 300, contributedAt: '2026-09-01T17:00:00.000Z' },
      ],
      now,
    )
    expect(pace).toEqual({ monthly: 200, months: 3 })
  })

  it('uses the shorter history of a young goal (at least one month)', () => {
    const pace = currentPace(
      [
        { amount: 100, contributedAt: '2026-09-25T17:00:00.000Z' },
        { amount: 100, contributedAt: '2026-09-30T17:00:00.000Z' },
      ],
      now,
    )
    expect(pace).toEqual({ monthly: 200, months: 1 })
  })

  it('is null with fewer than two contributions in the window', () => {
    expect(
      currentPace([{ amount: 100, contributedAt: '2026-09-25T17:00:00.000Z' }], now),
    ).toBeNull()
  })

  it('projects a reach date only when it makes sense', () => {
    // 3 months = 91.3 days → 92 days after Oct 1.
    expect(projectedReachDate(600, 200, now)).toBe('2027-01-01')
    expect(projectedReachDate(600, 0, now)).toBeNull()
    expect(projectedReachDate(0, 200, now)).toBeNull()
    expect(projectedReachDate(1_000_000, 1, now)).toBeNull()
  })
})

describe('contributedAt keeps its day', () => {
  it('sends a past day as noon Bogotá and today as the current instant', () => {
    expect(fromDateInputValue('2026-09-15', now)).toBe('2026-09-15T17:00:00.000Z')
    expect(fromDateInputValue('2026-10-01', now)).toBe(now.toISOString())
    const series = savingsSeries({
      createdAt: '2026-09-01T15:00:00.000Z',
      currentAmount: 100,
      contributions: [{ amount: 100, contributedAt: fromDateInputValue('2026-09-15', now) }],
    })
    expect(series[0].dateKey).toBe('2026-09-15')
  })
})

describe('required monthly total (from the backend plan)', () => {
  const plan = (requiredMonthlyContribution: number, isOverdue = false) => ({
    plan: { monthsRemaining: isOverdue ? 0 : 3, requiredMonthlyContribution, isOverdue },
  })

  it('adds every plan, overdue ones with their whole remaining — like the alert', () => {
    // Today's real goals: Viaje 3.333.334 + Carro 4.000.000.
    expect(totalRequiredMonthly([plan(3_333_334), plan(4_000_000)])).toBe(7_333_334)
    expect(totalRequiredMonthly([plan(100), plan(900, true)])).toBe(1_000)
  })

  it('ignores goals without a plan (not ACTIVE)', () => {
    expect(totalRequiredMonthly([plan(100), { plan: null }])).toBe(100)
  })
})
