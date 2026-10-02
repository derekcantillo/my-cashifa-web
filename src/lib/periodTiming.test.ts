import { describe, expect, it, vi } from 'vitest'

import { findPeriodForDateKey, getPeriodTiming } from './periodTiming'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

const periods = [
  { id: 'aug', startDate: '2026-08-28T05:00:00.000Z', endDate: '2026-09-29T05:00:00.000Z' },
  { id: 'sep', startDate: '2026-09-29T05:00:00.000Z', endDate: null },
]

describe('findPeriodForDateKey', () => {
  it('files a day in the period that contains it (Bogotá)', () => {
    expect(findPeriodForDateKey(periods, '2026-09-28')?.id).toBe('aug')
    expect(findPeriodForDateKey(periods, '2026-09-29')?.id).toBe('sep')
    expect(findPeriodForDateKey(periods, '2026-12-01')?.id).toBe('sep')
    expect(findPeriodForDateKey(periods, '2026-01-01')).toBeUndefined()
  })
})

describe('getPeriodTiming', () => {
  it('counts the open period day by day, both ends included', () => {
    const timing = getPeriodTiming(periods[1], new Date('2026-10-01T15:00:00.000Z'))
    expect(timing).toEqual({
      startKey: '2026-09-29',
      lastKey: '2026-10-01',
      elapsedDays: 3,
      isOpen: true,
    })
  })

  it('uses the last day of a closed period (endDate is exclusive)', () => {
    const timing = getPeriodTiming(periods[0])
    expect(timing.lastKey).toBe('2026-09-28')
    expect(timing.elapsedDays).toBe(32)
  })
})
