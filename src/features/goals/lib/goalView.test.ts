import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'

import { timeLeftLabel } from './goalView'

// Echoes the key and count, enough to check which label is picked.
const t = ((key: string, options?: { count?: number }) =>
  options?.count === undefined ? key : `${key}:${options.count}`) as unknown as TFunction<'goals'>

describe('time left label', () => {
  it('shows the whole months of the backend plan', () => {
    const label = timeLeftLabel(t, {
      plan: { monthsRemaining: 3, requiredMonthlyContribution: 3_333_334, isOverdue: false },
    })
    expect(label).toBe('list.monthsLeft:3')
  })

  it('says overdue instead of a month count', () => {
    const label = timeLeftLabel(t, {
      plan: { monthsRemaining: 0, requiredMonthlyContribution: 500, isOverdue: true },
    })
    expect(label).toBe('list.overdue')
  })

  it('has nothing to say without a plan (paused, completed)', () => {
    expect(timeLeftLabel(t, { plan: null })).toBeNull()
  })
})
