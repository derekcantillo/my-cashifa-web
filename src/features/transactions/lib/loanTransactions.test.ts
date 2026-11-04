import { describe, expect, it } from 'vitest'

import { TRANSACTION_TYPES } from '@/types'

import { isLoanMovement, loanIdOf } from './loanTransactions'

describe('loan movements in Gastos', () => {
  it('are read-only for LOAN_GIVEN and LOAN_REPAYMENT', () => {
    expect(isLoanMovement({ type: 'LOAN_GIVEN' })).toBe(true)
    expect(isLoanMovement({ type: 'LOAN_REPAYMENT' })).toBe(true)
  })

  it('every other type keeps edit and delete', () => {
    const others = TRANSACTION_TYPES.filter(t => t !== 'LOAN_GIVEN' && t !== 'LOAN_REPAYMENT')
    expect(others).toEqual(['EXPENSE', 'INCOME', 'SAVING', 'DEBT_PAYMENT', 'TRANSFER'])
    for (const type of others) expect(isLoanMovement({ type })).toBe(false)
  })

  it('links to the loan only through the exact loanId', () => {
    expect(loanIdOf({ type: 'LOAN_REPAYMENT', loanId: 'loan-1' })).toBe('loan-1')
    expect(loanIdOf({ type: 'LOAN_GIVEN', loanId: null })).toBeNull()
    // A manual expense filed under the Loan category is not a loan movement.
    expect(loanIdOf({ type: 'EXPENSE', loanId: null })).toBeNull()
  })
})
