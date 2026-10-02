import { describe, expect, it, vi } from 'vitest'

import { fromDateInputValue } from './format'
import {
  currentPace,
  daysUntil,
  displayPercent,
  monthsUntil,
  progressPercent,
  projectedReachDate,
  reachedOn,
  requiredContribution,
  savingsSeries,
  timeLeft,
  totalRequiredContribution,
} from './goalMath'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

// 2026-10-01 at 10:30 in Bogotá.
const now = new Date('2026-10-01T15:30:00.000Z')
const goal = (
  patch: Partial<{ currentAmount: number; targetAmount: number; targetDate: string }>,
) => ({
  currentAmount: 0,
  targetAmount: 1_200_000,
  targetDate: '2027-10-01T17:00:00.000Z',
  ...patch,
})

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

describe('months left in Bogotá time', () => {
  it('counts calendar days in Bogotá', () => {
    // 22:00 Bogotá on Oct 1 is already Oct 2 in UTC: still the same Bogotá day.
    const lateNight = new Date('2026-10-02T03:00:00.000Z')
    expect(daysUntil('2026-10-02T17:00:00.000Z', lateNight)).toBe(1)
    expect(daysUntil('2026-10-01T17:00:00.000Z', lateNight)).toBe(0)
  })

  it('is fractional and negative once passed', () => {
    expect(monthsUntil('2027-10-01T17:00:00.000Z', now)).toBeCloseTo(365 / 30.44, 5)
    expect(monthsUntil('2026-09-01T17:00:00.000Z', now)).toBeLessThan(0)
  })
})

describe('required monthly contribution', () => {
  it('divides what is left by the months until the target date', () => {
    const required = requiredContribution(goal({ currentAmount: 200_000 }), now)
    expect(required.kind).toBe('monthly')
    if (required.kind === 'monthly')
      expect(required.amount).toBeCloseTo(1_000_000 / (365 / 30.44), 2)
  })

  it('never divides by less than one month', () => {
    const required = requiredContribution(goal({ targetDate: '2026-10-15T17:00:00.000Z' }), now)
    expect(required).toEqual({ kind: 'monthly', amount: 1_200_000, months: 1 })
    // Due today: still one month, not a division by zero.
    expect(requiredContribution(goal({ targetDate: '2026-10-01T17:00:00.000Z' }), now)).toEqual({
      kind: 'monthly',
      amount: 1_200_000,
      months: 1,
    })
  })

  it('flags an overdue date instead of inventing a figure', () => {
    expect(requiredContribution(goal({ targetDate: '2026-09-30T17:00:00.000Z' }), now)).toEqual({
      kind: 'overdue',
    })
  })

  it('needs nothing once reached', () => {
    expect(requiredContribution(goal({ currentAmount: 1_300_000 }), now)).toEqual({
      kind: 'reached',
    })
  })

  it('sums only goals with a monthly figure', () => {
    const total = totalRequiredContribution(
      [
        goal({ targetDate: '2026-10-15T17:00:00.000Z' }), // 1.200.000 (min 1 month)
        goal({ targetDate: '2026-09-01T17:00:00.000Z' }), // overdue: 0
        goal({ currentAmount: 1_200_000 }), // reached: 0
      ],
      now,
    )
    expect(total).toBe(1_200_000)
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

describe('time left agrees with the required contribution', () => {
  it('uses the same months the requirement divides by', () => {
    const targetDate = '2027-01-10T17:00:00.000Z' // 101 days after Oct 1
    const left = timeLeft(targetDate, now)
    expect(left).toEqual({ kind: 'months', months: 3.3 })
    const required = requiredContribution(goal({ targetDate }), now)
    if (required.kind !== 'monthly' || left.kind !== 'months') throw new Error('unexpected')
    expect(required.months).toBeCloseTo(left.months, 1)
  })

  it('reads in days under a month, where the whole remaining amount is due', () => {
    const targetDate = '2026-10-21T17:00:00.000Z'
    expect(timeLeft(targetDate, now)).toEqual({ kind: 'days', days: 20 })
    expect(requiredContribution(goal({ targetDate }), now)).toMatchObject({ amount: 1_200_000 })
  })

  it('handles today and past dates like the requirement', () => {
    expect(timeLeft('2026-10-01T17:00:00.000Z', now)).toEqual({ kind: 'today' })
    expect(timeLeft('2026-09-30T17:00:00.000Z', now)).toEqual({ kind: 'overdue' })
  })
})
