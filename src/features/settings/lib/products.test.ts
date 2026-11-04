import { describe, expect, it } from 'vitest'

import type { Account, CreditCardState } from '@/types'

import {
  cardSummaryParts,
  debitCardLabel,
  formatCardSummary,
  groupProducts,
  productKind,
  type CardSummaryKey,
} from './products'

const account = (id: string, overrides: Partial<Account> = {}): Account => ({
  id,
  name: id,
  type: 'SAVINGS_ACCOUNT',
  createdAt: '2026-09-18T10:00:00.000Z',
  updatedAt: '2026-09-18T10:00:00.000Z',
  initialBalance: 0,
  initialBalanceDate: null,
  currentBalance: 0,
  institution: null,
  hasDebitCard: false,
  cardLast4: null,
  creditCard: null,
  ...overrides,
})

const BANCOLOMBIA = { id: 'bancolombia', name: 'Bancolombia' }
const NEQUI = { id: 'nequi', name: 'Nequi' }
const DAVIVIENDA = { id: 'davivienda', name: 'davivienda' }

const card = (overrides: Partial<CreditCardState> = {}): CreditCardState => ({
  configured: true,
  creditLimit: 4_300_000,
  statementDay: 31,
  paymentDueDay: 17,
  defaultMonthlyRate: 2.1155,
  defaultEffectiveAnnualRate: 28.5583,
  debt: 4_539_024,
  available: 0,
  overLimit: 239_024,
  nextStatementDate: '2026-11-30',
  nextPaymentDate: '2026-11-17',
  activePlans: 0,
  remainingInstallmentPrincipal: 0,
  ...overrides,
})

describe('groupProducts', () => {
  it('groups by institution alphabetically (ignoring case) and leaves "Sin entidad" last', () => {
    const groups = groupProducts(
      [
        account('efectivo', { type: 'CASH' }),
        account('ahorros', { institution: BANCOLOMBIA }),
        account('visa', { type: 'CREDIT_CARD', institution: BANCOLOMBIA }),
        account('nequi', { type: 'DIGITAL_WALLET', institution: NEQUI }),
        account('tc-davivienda', { type: 'CREDIT_CARD', institution: DAVIVIENDA }),
      ],
      [
        { ...NEQUI, accountCount: 1 },
        { ...BANCOLOMBIA, accountCount: 2 },
        { ...DAVIVIENDA, accountCount: 1 },
      ],
      'es-CO',
    )

    expect(groups.map(group => [group.name, group.accounts.map(item => item.id)])).toEqual([
      ['Bancolombia', ['ahorros', 'visa']],
      ['davivienda', ['tc-davivienda']],
      ['Nequi', ['nequi']],
      [null, ['efectivo']],
    ])
  })

  it('keeps institutions without products (to rename or delete them) and hides an empty "Sin entidad"', () => {
    const groups = groupProducts(
      [account('ahorros', { institution: BANCOLOMBIA })],
      [
        { ...BANCOLOMBIA, accountCount: 1 },
        { id: 'falabella', name: 'Falabella', accountCount: 0 },
      ],
      'es-CO',
    )

    expect(groups.map(group => [group.id, group.accountCount])).toEqual([
      ['bancolombia', 1],
      ['falabella', 0],
    ])
  })

  it('an institution missing from the cached list still gets its group', () => {
    const groups = groupProducts([account('nequi', { institution: NEQUI })], [], 'es-CO')

    expect(groups).toEqual([
      expect.objectContaining({ id: 'nequi', name: 'Nequi', accountCount: 1 }),
    ])
  })
})

describe('productKind', () => {
  it.each([
    ['SAVINGS_ACCOUNT', 'account'],
    ['CHECKING_ACCOUNT', 'account'],
    ['DEBIT_CARD', 'account'],
    ['DIGITAL_WALLET', 'wallet'],
    ['CASH', 'cash'],
    ['CREDIT_CARD', 'card'],
  ] as const)('%s → %s', (type, kind) => {
    expect(productKind(type)).toBe(kind)
  })
})

describe('card summary', () => {
  const LABELS: Record<CardSummaryKey, string> = {
    owe: 'Debes',
    available: 'Disponible',
    overLimit: 'Sobrecupo',
    limit: 'Cupo',
  }
  const money = (value: number) => `$ ${value.toLocaleString('es-CO')}`
  const text = (state: CreditCardState) =>
    formatCardSummary(cardSummaryParts(state)!, (key, amount) => `${LABELS[key]} ${amount}`, money)

  it('TC VISA over its limit: available 0 and the over-limit shown', () => {
    expect(text(card())).toBe(
      'Debes $ 4.539.024 · Disponible $ 0 · Sobrecupo $ 239.024 · Cupo $ 4.300.000',
    )
  })

  it('TC Davivienda within its limit: no over-limit part', () => {
    expect(
      text(card({ creditLimit: 11_500_000, debt: 4_670_990, available: 6_829_010, overLimit: 0 })),
    ).toBe('Debes $ 4.670.990 · Disponible $ 6.829.010 · Cupo $ 11.500.000')
  })

  it('an unconfigured card has no summary (its balance says nothing about the debt)', () => {
    expect(
      cardSummaryParts(card({ configured: false, creditLimit: null, debt: null, available: null })),
    ).toBeNull()
    expect(cardSummaryParts(null)).toBeNull()
  })
})

describe('debitCardLabel', () => {
  it('shows the digits when there are some', () => {
    expect(
      debitCardLabel(
        { type: 'SAVINGS_ACCOUNT', hasDebitCard: true, cardLast4: '1234' },
        'Tarjeta débito',
      ),
    ).toBe('Tarjeta débito •••• 1234')
    expect(
      debitCardLabel(
        { type: 'DIGITAL_WALLET', hasDebitCard: true, cardLast4: null },
        'Tarjeta débito',
      ),
    ).toBe('Tarjeta débito')
  })

  it('nothing without a debit card, nor on a credit card', () => {
    expect(
      debitCardLabel({ type: 'SAVINGS_ACCOUNT', hasDebitCard: false, cardLast4: null }, 'x'),
    ).toBeNull()
    expect(
      debitCardLabel({ type: 'CREDIT_CARD', hasDebitCard: true, cardLast4: '9876' }, 'x'),
    ).toBeNull()
  })
})
