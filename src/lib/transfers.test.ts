import { describe, expect, it } from 'vitest'

import type { AccountSummary } from '@/types'

import { isCardPayment, isTransfer, transferRoute } from './transfers'

const STAMP = '2026-09-18T10:00:00.000Z'
const account = (name: string, type: AccountSummary['type']): AccountSummary => ({
  id: name,
  name,
  type,
  createdAt: STAMP,
  updatedAt: STAMP,
})
const SAVINGS = account('Ahorros Bancolombia', 'DEBIT_CARD')
const VISA = account('TC VISA Clásica', 'CREDIT_CARD')
const NEQUI = account('Nequi', 'SAVINGS_ACCOUNT')

describe('transfers', () => {
  it('only TRANSFER is a transfer', () => {
    expect(isTransfer({ type: 'TRANSFER' })).toBe(true)
    expect(isTransfer({ type: 'EXPENSE' })).toBe(false)
    expect(isTransfer({ type: 'SAVING' })).toBe(false)
  })

  it('a transfer into a credit card is a card payment', () => {
    expect(isCardPayment({ type: 'TRANSFER', toAccount: VISA })).toBe(true)
    expect(isCardPayment({ type: 'TRANSFER', toAccount: NEQUI })).toBe(false)
    // An expense paid with the card is not paying it.
    expect(isCardPayment({ type: 'EXPENSE', toAccount: VISA })).toBe(false)
  })

  it('reads origin → destination, naming a missing account', () => {
    expect(transferRoute({ account: SAVINGS, toAccount: VISA }, '—')).toBe(
      'Ahorros Bancolombia → TC VISA Clásica',
    )
    expect(transferRoute({ account: null, toAccount: VISA }, 'Cuenta eliminada')).toBe(
      'Cuenta eliminada → TC VISA Clásica',
    )
  })
})
