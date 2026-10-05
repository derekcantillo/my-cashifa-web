import { describe, expect, it } from 'vitest'

import type { Loan } from '@/types'

import { loanTotals, nextDueLoan, receivables, sortLoans } from './loanMath'

const loan = (patch: Partial<Loan> & Pick<Loan, 'id'>): Loan => ({
  borrowerName: patch.id,
  amount: 1000,
  amountRepaid: 0,
  remainingAmount: 1000,
  status: 'ACTIVE',
  loanDate: '2026-07-01T17:00:00.000Z',
  dueDate: null,
  note: null,
  accountId: null,
  createdAt: '2026-07-01T17:00:00.000Z',
  updatedAt: '2026-07-01T17:00:00.000Z',
  ...patch,
})

const loans = [
  loan({
    id: 'paid-old',
    amount: 4000,
    amountRepaid: 4000,
    remainingAmount: 0,
    status: 'PAID',
    updatedAt: '2026-08-01T00:00:00Z',
  }),
  loan({
    id: 'partial',
    amount: 500,
    amountRepaid: 200,
    remainingAmount: 300,
    status: 'PARTIALLY_PAID',
    dueDate: '2026-11-01T17:00:00Z',
  }),
  loan({ id: 'no-due-old', amount: 300, remainingAmount: 300, loanDate: '2026-05-01T17:00:00Z' }),
  loan({ id: 'soon', amount: 200, remainingAmount: 200, dueDate: '2026-10-15T17:00:00Z' }),
  loan({ id: 'no-due-new', amount: 100, remainingAmount: 100, loanDate: '2026-09-01T17:00:00Z' }),
  loan({
    id: 'paid-new',
    amount: 50,
    amountRepaid: 60,
    remainingAmount: -10,
    status: 'PAID',
    updatedAt: '2026-10-01T00:00:00Z',
  }),
]

describe('loan math', () => {
  it('receivables = what open loans still owe (paid ones excluded, like /net-worth)', () => {
    expect(receivables(loans)).toBe(300 + 300 + 200 + 100)
    expect(receivables([])).toBe(0)
  })

  it('totals split open vs historical', () => {
    expect(loanTotals(loans)).toEqual({
      activeCount: 4,
      outstanding: 900,
      activeLent: 1100,
      activeRecovered: 200,
      totalLent: 5150,
      totalRecovered: 4260,
    })
  })

  it('orders open loans by due date, then oldest; paid ones most recent first', () => {
    const { open, paid } = sortLoans(loans)
    expect(open.map(l => l.id)).toEqual(['soon', 'partial', 'no-due-old', 'no-due-new'])
    expect(paid.map(l => l.id)).toEqual(['paid-new', 'paid-old'])
  })

  it('finds the next due loan among open ones', () => {
    expect(nextDueLoan(loans)?.id).toBe('soon')
    expect(nextDueLoan([loans[2]])).toBeUndefined()
  })
})
