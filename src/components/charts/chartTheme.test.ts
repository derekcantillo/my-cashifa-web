import { describe, expect, it, vi } from 'vitest'

import { moneyTickLabels, niceTicks } from './chartTheme'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

describe('niceTicks', () => {
  it('uses the smallest {1, 2, 2.5, 5}×10ⁿ step that fits in four intervals', () => {
    expect(niceTicks(2_906_689)).toEqual({
      domain: [0, 3_000_000],
      ticks: [0, 1_000_000, 2_000_000, 3_000_000],
    })
    expect(niceTicks(4_200_000).ticks).toEqual([0, 2_000_000, 4_000_000, 6_000_000])
    expect(niceTicks(10_000_000).ticks).toEqual([0, 2_500_000, 5_000_000, 7_500_000, 10_000_000])
  })

  it('ends the domain on the last tick (top grid line = maximum)', () => {
    for (const max of [1, 7, 99, 101, 333_333, 6_000_000, 123_456_789]) {
      const { domain, ticks } = niceTicks(max)
      expect(domain[1]).toBe(ticks[ticks.length - 1])
      expect(domain[1]).toBeGreaterThanOrEqual(max)
      expect(ticks.length - 1).toBeLessThanOrEqual(4)
      const step = ticks[1] - ticks[0]
      ticks.forEach((tick, index) => expect(tick).toBeCloseTo(index * step))
    }
  })

  it('gives a minimal domain for zero', () => {
    expect(niceTicks(0)).toEqual({ domain: [0, 1], ticks: [0] })
    expect(niceTicks(Number.NaN)).toEqual({ domain: [0, 1], ticks: [0] })
  })

  it('handles very small and very large maxima without float noise', () => {
    expect(niceTicks(0.3).ticks).toEqual([0, 0.1, 0.2, 0.3])
    expect(niceTicks(0.07).ticks).toEqual([0, 0.02, 0.04, 0.06, 0.08])
    expect(niceTicks(3.4e12).ticks).toEqual([0, 1e12, 2e12, 3e12, 4e12])
  })
})

describe('moneyTickLabels', () => {
  it('formats compact money with up to one decimal', () => {
    const labels = moneyTickLabels([0, 2_500_000, 5_000_000, 7_500_000, 10_000_000], 'en-US')
    expect([...labels.values()]).toEqual(['$0', '$2.5M', '$5M', '$7.5M', '$10M'])
  })

  it('never repeats a label for different ticks', () => {
    // At one decimal 1.020.000 and 1.040.000 would both read "$1M".
    const labels = moneyTickLabels([0, 1_020_000, 1_040_000], 'en-US')
    expect(new Set(labels.values()).size).toBe(3)
  })
})
