import { describe, expect, it } from 'vitest'

import { TRANSACTION_TYPES } from '@/types'

import { getTransactionDirection } from './transactionDirection'

describe('transaction direction', () => {
  it('only income and spending have a direction; the rest is money moved', () => {
    expect(
      Object.fromEntries(TRANSACTION_TYPES.map(type => [type, getTransactionDirection(type)])),
    ).toEqual({
      EXPENSE: 'out',
      INCOME: 'in',
      SAVING: 'moved',
      DEBT_PAYMENT: 'out',
      LOAN_GIVEN: 'moved',
      LOAN_REPAYMENT: 'in',
      TRANSFER: 'moved',
    })
  })
})
