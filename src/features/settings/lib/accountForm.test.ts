import { describe, expect, it, vi } from 'vitest'

import type { Account } from '@/types'

import {
  accountFormDefaults,
  createAccountSchema,
  findInstitutionByName,
  initialBalanceOf,
  initialStatementOf,
  limitNeedsStatement,
  NEW_INSTITUTION,
  parseRateInput,
  toCreateAccountInput,
  toUpdateAccountInput,
  type AccountFormValues,
} from './accountForm'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

const LOCALE = 'es-CO'
const TODAY = '2026-11-04'
const EMPTY = accountFormDefaults(undefined, LOCALE)

/** First issue per field, like react-hook-form shows it. */
const errorsOf = (values: AccountFormValues) => {
  const result = createAccountSchema(LOCALE, TODAY).safeParse(values)
  const errors: Record<string, string> = {}
  if (result.success) return errors
  for (const issue of result.error.issues) errors[issue.path.join('.')] ??= issue.message
  return errors
}

const account = (overrides: Partial<Account> = {}): Account => ({
  id: 'acc',
  name: 'Ahorros Bancolombia',
  type: 'SAVINGS_ACCOUNT',
  createdAt: '2026-09-18T10:21:39.241Z',
  updatedAt: '2026-09-18T10:21:39.241Z',
  initialBalance: 5_199_379.32,
  initialBalanceDate: '2026-09-18T10:21:39.241Z',
  currentBalance: 14_810_463.22,
  institution: null,
  hasDebitCard: false,
  cardLast4: null,
  creditCard: null,
  ...overrides,
})

const VISA_STATE = {
  configured: false,
  creditLimit: null,
  statementDay: null,
  paymentDueDay: null,
  defaultMonthlyRate: null,
  defaultEffectiveAnnualRate: null,
  debt: null,
  available: null,
  overLimit: null,
  nextStatementDate: null,
  nextPaymentDate: null,
  activePlans: 0,
  remainingInstallmentPrincipal: 0,
}

describe('parseRateInput', () => {
  it.each([
    ['2,1155', 2.1155],
    ['2.1155', 2.1155],
    ['0', 0],
    ['1,99 %', 1.99],
  ])('%s → %d', (value, expected) => {
    expect(parseRateInput(value)).toBe(expected)
  })

  it.each(['2,11555', '-1', 'abc', '1.000,5'])('rejects %s', value => {
    expect(parseRateInput(value)).toBeNaN()
  })
})

describe('account form validation', () => {
  const card: AccountFormValues = { ...EMPTY, name: 'TC Davivienda', type: 'CREDIT_CARD' }

  it('accepts a savings account with a debit card and its digits', () => {
    expect(errorsOf({ ...EMPTY, name: 'Ahorros', hasDebitCard: true, cardLast4: '1234' })).toEqual(
      {},
    )
  })

  it('requires a name and the name of a new institution', () => {
    expect(errorsOf({ ...EMPTY, institutionChoice: NEW_INSTITUTION })).toEqual({
      name: 'nameRequired',
      newInstitutionName: 'institutionNameRequired',
    })
  })

  it('digits need a card: a credit card or a debit card', () => {
    expect(
      errorsOf({ ...EMPTY, name: 'Nequi', type: 'DIGITAL_WALLET', cardLast4: '1234' }),
    ).toEqual({ cardLast4: 'cardLast4NeedsCard' })
    expect(errorsOf({ ...card, cardLast4: '123' })).toEqual({ cardLast4: 'cardLast4Invalid' })
    expect(errorsOf({ ...card, cardLast4: '9876' })).toEqual({})
  })

  it('validates the card settings', () => {
    expect(
      errorsOf({
        ...card,
        creditLimit: '0',
        statementDay: '32',
        paymentDueDay: '0',
        monthlyRate: '101',
      }),
    ).toEqual({
      creditLimit: 'limitInvalid',
      statementDay: 'dayInvalid',
      paymentDueDay: 'dayInvalid',
      monthlyRate: 'rateInvalid',
    })
    expect(
      errorsOf({
        ...card,
        creditLimit: '11.500.000',
        statementDay: '29',
        paymentDueDay: '15',
        monthlyRate: '0',
      }),
    ).toEqual({})
  })

  it('the last statement of a new card needs both the cut date and the debt, not in the future', () => {
    expect(errorsOf({ ...card, statementCutDate: '2026-10-29' })).toEqual({
      statementDebt: 'statementIncomplete',
    })
    expect(errorsOf({ ...card, statementCutDate: '2026-11-05', statementDebt: '1' })).toEqual({
      statementCutDate: 'dateFuture',
    })
  })
})

describe('account form requests', () => {
  it('a new card sends its settings and, apart, its last statement', () => {
    const values: AccountFormValues = {
      ...EMPTY,
      name: 'TC Davivienda',
      type: 'CREDIT_CARD',
      cardLast4: '4321',
      creditLimit: '11.500.000',
      statementDay: '29',
      paymentDueDay: '15',
      statementCutDate: '2026-10-29',
      statementDebt: '4.670.990',
      // Ignored on a card.
      hasDebitCard: true,
      initialBalance: '5',
    }

    expect(toCreateAccountInput(values, LOCALE, 'davivienda')).toEqual({
      name: 'TC Davivienda',
      type: 'CREDIT_CARD',
      institutionId: 'davivienda',
      cardLast4: '4321',
      creditLimit: 11_500_000,
      statementDay: 29,
      paymentDueDay: 15,
    })
    expect(initialStatementOf(values, LOCALE)).toEqual({
      cutDate: '2026-10-29',
      totalDebt: 4_670_990,
    })
    expect(initialBalanceOf(values, LOCALE)).toBeNull()
  })

  it('a new account sends no card fields and its starting balance apart', () => {
    const values: AccountFormValues = {
      ...EMPTY,
      name: 'Nequi',
      type: 'DIGITAL_WALLET',
      initialBalance: '-1.968,34',
      creditLimit: '1.000',
    }

    expect(toCreateAccountInput(values, LOCALE, null)).toEqual({
      name: 'Nequi',
      type: 'DIGITAL_WALLET',
    })
    expect(initialBalanceOf(values, LOCALE)).toBe(-1_968.34)
  })

  it('edit sends only what changed: the old DEBIT_CARD account becomes savings with a debit card', () => {
    const legacy = account({ type: 'DEBIT_CARD' })
    const values = {
      ...accountFormDefaults(legacy, LOCALE),
      institutionChoice: 'bancolombia',
      cardLast4: '1234',
    }

    expect(toUpdateAccountInput(values, legacy, LOCALE, 'bancolombia')).toEqual({
      type: 'SAVINGS_ACCOUNT',
      institutionId: 'bancolombia',
      hasDebitCard: true,
      cardLast4: '1234',
    })
  })

  it('edit can unlink the institution and clear the digits', () => {
    const linked = account({
      institution: { id: 'bancolombia', name: 'Bancolombia' },
      hasDebitCard: true,
      cardLast4: '1234',
    })
    const values = {
      ...accountFormDefaults(linked, LOCALE),
      institutionChoice: '',
      hasDebitCard: false,
      cardLast4: '',
    }

    expect(toUpdateAccountInput(values, linked, LOCALE, null)).toEqual({
      institutionId: null,
      hasDebitCard: false,
      cardLast4: null,
    })
  })

  it('leaving the card type clears its card fields', () => {
    const card = account({
      type: 'CREDIT_CARD',
      creditCard: { ...VISA_STATE, configured: true, creditLimit: 1_000_000, statementDay: 29 },
    })
    const values = { ...accountFormDefaults(card, LOCALE), type: 'SAVINGS_ACCOUNT' as const }

    expect(toUpdateAccountInput(values, card, LOCALE, null)).toEqual({
      type: 'SAVINGS_ACCOUNT',
      creditLimit: null,
      statementDay: null,
    })
  })

  it('an unchanged card form sends nothing', () => {
    const card = account({
      type: 'CREDIT_CARD',
      creditCard: {
        ...VISA_STATE,
        configured: true,
        creditLimit: 4_300_000,
        statementDay: 31,
        paymentDueDay: 17,
        defaultMonthlyRate: 2.1155,
      },
    })

    expect(toUpdateAccountInput(accountFormDefaults(card, LOCALE), card, LOCALE, null)).toEqual({})
  })
})

describe('helpers', () => {
  it('finds an existing institution ignoring case and spaces', () => {
    const institutions = [{ id: 'bancolombia', name: 'Bancolombia' }]
    expect(findInstitutionByName(institutions, '  bancolombia ')?.id).toBe('bancolombia')
    expect(findInstitutionByName(institutions, 'Nequi')).toBeUndefined()
  })

  it('an unconfigured card with a balance gets its limit through the statement', () => {
    expect(limitNeedsStatement(account({ type: 'CREDIT_CARD', creditCard: VISA_STATE }))).toBe(true)
    expect(
      limitNeedsStatement(
        account({
          type: 'CREDIT_CARD',
          initialBalance: 0,
          currentBalance: 0,
          creditCard: VISA_STATE,
        }),
      ),
    ).toBe(false)
    expect(limitNeedsStatement(account())).toBe(false)
  })
})
