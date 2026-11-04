import { describe, expect, it } from 'vitest'

import { toAccount, toBalanceAdjustment } from './accounts'

const BASE = {
  id: 'visa',
  name: 'TC VISA Clásica',
  type: 'CREDIT_CARD' as const,
  createdAt: '2026-09-18T10:24:56.524Z',
  updatedAt: '2026-11-04T22:15:10.269Z',
  initialBalance: '-4539024.00',
  initialBalanceDate: '2026-11-01T05:00:00.000Z',
  currentBalance: -4539024,
  institution: { id: 'bancolombia', name: 'Bancolombia' },
  hasDebitCard: false,
  cardLast4: '9876',
}

const CARD = {
  configured: true,
  creditLimit: 4300000,
  statementDay: 31,
  paymentDueDay: 17,
  defaultMonthlyRate: 2.1155,
  defaultEffectiveAnnualRate: 28.5583,
  debt: 4539024,
  available: 0,
  overLimit: 239024,
  nextStatementDate: '2026-11-30',
  nextPaymentDate: '2026-11-17',
}

describe('toAccount', () => {
  it('maps the card block and parses decimals sent as strings', () => {
    const account = toAccount({
      ...BASE,
      creditCard: {
        ...CARD,
        debt: '4539024.00',
        activePlans: 3,
        remainingInstallmentPrincipal: 2492451.68,
      },
    })

    expect(account.initialBalance).toBe(-4_539_024)
    expect(account.creditCard).toEqual({
      ...CARD,
      activePlans: 3,
      remainingInstallmentPrincipal: 2_492_451.68,
    })
  })

  it('an unconfigured card keeps null figures; a backend without plans means 0 plans', () => {
    const account = toAccount({
      ...BASE,
      creditCard: {
        ...CARD,
        configured: false,
        creditLimit: null,
        debt: null,
        available: null,
        overLimit: null,
      },
    })

    expect(account.creditCard).toMatchObject({
      configured: false,
      debt: null,
      available: null,
      overLimit: null,
      activePlans: 0,
      remainingInstallmentPrincipal: 0,
    })
  })

  it('accounts from an older backend get the product defaults', () => {
    const { institution, hasDebitCard, cardLast4, ...legacy } = BASE
    void institution
    void hasDebitCard
    void cardLast4

    const account = toAccount({ ...legacy, type: 'DEBIT_CARD' } as Parameters<typeof toAccount>[0])

    expect(account).toMatchObject({
      institution: null,
      hasDebitCard: false,
      cardLast4: null,
      creditCard: null,
    })
  })
})

describe('toBalanceAdjustment', () => {
  it('parses every amount', () => {
    expect(
      toBalanceAdjustment({
        id: 'adj_1',
        accountId: 'visa',
        reason: 'STATEMENT',
        oldAmount: '1766523.00',
        oldDate: '2026-09-18T10:24:56.524Z',
        newAmount: -4539024,
        newDate: '2026-11-01T05:00:00.000Z',
        oldCreditLimit: null,
        newCreditLimit: '4300000.00',
        statementDate: '2026-10-31',
        balanceBefore: 1007408,
        balanceAfter: -4539024,
        revertsId: null,
        revertedById: null,
        createdAt: '2026-11-04T22:15:10.273Z',
      }),
    ).toMatchObject({
      oldAmount: 1_766_523,
      newCreditLimit: 4_300_000,
      oldCreditLimit: null,
      balanceBefore: 1_007_408,
    })
  })
})
