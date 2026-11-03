import { describe, expect, it, vi } from 'vitest'

import {
  firstRepayment,
  loanAmountError,
  loanDateAfterFirstRepayment,
  repaymentBeforeLoan,
} from './loanEdit'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

describe('loanAmountError', () => {
  it('rejects zero and negative amounts', () => {
    expect(loanAmountError(0, 0)).toBe('amountPositive')
    expect(loanAmountError(-5, 0)).toBe('amountPositive')
    expect(loanAmountError(Number.NaN, 0)).toBe('amountPositive')
  })

  it('rejects an amount below what was already repaid', () => {
    expect(loanAmountError(299_999, 300_000)).toBe('amountBelowRepaid')
  })

  it('accepts an amount equal to or above what was repaid', () => {
    expect(loanAmountError(300_000, 300_000)).toBeNull()
    expect(loanAmountError(500_000, 300_000)).toBeNull()
    expect(loanAmountError(1, 0)).toBeNull()
  })
})

describe('firstRepayment', () => {
  it('returns the earliest one, whatever the order', () => {
    const repayments = [
      { id: 'b', paidAt: '2026-09-25T17:00:00.000Z' },
      { id: 'a', paidAt: '2026-09-15T17:00:00.000Z' },
      { id: 'c', paidAt: '2026-10-01T17:00:00.000Z' },
    ]
    expect(firstRepayment(repayments)?.id).toBe('a')
  })

  it('returns undefined without repayments', () => {
    expect(firstRepayment([])).toBeUndefined()
  })
})

describe('loanDateAfterFirstRepayment', () => {
  // 15 Sep, 8:00 a.m. in Bogotá.
  const first = { paidAt: '2026-09-15T13:00:00.000Z' }

  it('flags a loan date after the first repayment day', () => {
    expect(loanDateAfterFirstRepayment('2026-09-16', first)).toBe(true)
  })

  it('allows the same day and earlier days', () => {
    expect(loanDateAfterFirstRepayment('2026-09-15', first)).toBe(false)
    expect(loanDateAfterFirstRepayment('2026-09-01', first)).toBe(false)
  })

  it('compares Bogotá days, not UTC', () => {
    // 15 Sep, 11:00 p.m. in Bogotá is already 16 Sep in UTC.
    expect(loanDateAfterFirstRepayment('2026-09-15', { paidAt: '2026-09-16T04:00:00.000Z' })).toBe(
      false,
    )
  })

  it('allows any date without repayments', () => {
    expect(loanDateAfterFirstRepayment('2030-01-01', undefined)).toBe(false)
  })
})

describe('repaymentBeforeLoan', () => {
  // 10 Sep at noon in Bogotá.
  const loanDate = '2026-09-10T17:00:00.000Z'

  it('flags a repayment day before the loan day', () => {
    expect(repaymentBeforeLoan('2026-09-09', loanDate)).toBe(true)
  })

  it('allows the loan day itself and later days', () => {
    expect(repaymentBeforeLoan('2026-09-10', loanDate)).toBe(false)
    expect(repaymentBeforeLoan('2026-09-11', loanDate)).toBe(false)
  })

  it('reads the loan date in Bogotá, not UTC', () => {
    // 10 Sep, 11:00 p.m. in Bogotá is already 11 Sep in UTC.
    expect(repaymentBeforeLoan('2026-09-10', '2026-09-11T04:00:00.000Z')).toBe(false)
  })
})
