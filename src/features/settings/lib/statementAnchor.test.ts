import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { apiErrorMessage } from '@/lib/apiError'
import type { Account, BalanceAdjustment } from '@/types'

import {
  anchorErrorMessages,
  anchorPreview,
  cardStatementDefaults,
  createBankBalanceSchema,
  createCardStatementSchema,
  toBankBalanceInput,
  toCardStatementInput,
  undoableAdjustmentId,
} from './statementAnchor'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

const LOCALE = 'es-CO'
const TODAY = '2026-11-04'

const errorsOf = (
  schema: ReturnType<typeof createCardStatementSchema> | ReturnType<typeof createBankBalanceSchema>,
  values: object,
) => {
  const result = schema.safeParse(values)
  const errors: Record<string, string> = {}
  if (result.success) return errors
  for (const issue of result.error.issues) errors[issue.path.join('.')] ??= issue.message
  return errors
}

const visa = (creditLimit: number | null): Account => ({
  id: 'visa',
  name: 'TC VISA Clásica',
  type: 'CREDIT_CARD',
  createdAt: '2026-09-18T10:24:56.524Z',
  updatedAt: '2026-09-18T10:24:56.524Z',
  initialBalance: 1_766_523,
  initialBalanceDate: '2026-09-18T10:24:56.524Z',
  currentBalance: 1_007_408,
  institution: null,
  hasDebitCard: false,
  cardLast4: null,
  creditCard: {
    configured: creditLimit !== null,
    creditLimit,
    statementDay: 31,
    paymentDueDay: 17,
    defaultMonthlyRate: null,
    defaultEffectiveAnnualRate: null,
    debt: null,
    available: null,
    overLimit: null,
    nextStatementDate: null,
    nextPaymentDate: null,
    activePlans: 0,
    remainingInstallmentPrincipal: 0,
  },
})

describe('card statement', () => {
  const schema = createCardStatementSchema(LOCALE, TODAY, true)

  it('accepts the October statement of the TC VISA', () => {
    expect(
      errorsOf(schema, { cutDate: '2026-10-31', totalDebt: '4.539.024', creditLimit: '4.300.000' }),
    ).toEqual({})
  })

  it('requires the limit while the card has none, a past cut date and the debt', () => {
    expect(errorsOf(schema, { cutDate: '2026-11-05', totalDebt: '', creditLimit: '' })).toEqual({
      cutDate: 'dateFuture',
      totalDebt: 'amountRequired',
      creditLimit: 'limitRequired',
    })
    expect(
      errorsOf(createCardStatementSchema(LOCALE, TODAY, false), {
        cutDate: '2026-11-03',
        totalDebt: '0',
        creditLimit: '',
      }),
    ).toEqual({})
  })

  it('a negative debt is not valid (a credit balance is not a statement debt)', () => {
    expect(errorsOf(schema, { cutDate: '2026-10-31', totalDebt: '-5', creditLimit: '1' })).toEqual({
      totalDebt: 'amountInvalid',
    })
  })

  it('sends the limit when it is new or changes, not when it stays', () => {
    const values = { cutDate: '2026-10-31', totalDebt: '4.539.024', creditLimit: '4.300.000' }

    expect(toCardStatementInput(values, visa(null), LOCALE)).toEqual({
      cutDate: '2026-10-31',
      totalDebt: 4_539_024,
      creditLimit: 4_300_000,
    })
    expect(toCardStatementInput(values, visa(4_300_000), LOCALE)).toEqual({
      cutDate: '2026-10-31',
      totalDebt: 4_539_024,
    })
    expect(cardStatementDefaults(visa(4_300_000), LOCALE).creditLimit).toBe('4.300.000')
  })

  it('preview: the balance becomes −debt and counts movements from the day after the cut', () => {
    expect(anchorPreview({ cutDate: '2026-10-31', totalDebt: 4_539_024 })).toEqual({
      anchorAmount: -4_539_024,
      statementDate: '2026-10-31',
      countsFrom: '2026-11-01',
    })
  })
})

describe('bank balance', () => {
  const schema = createBankBalanceSchema(LOCALE, TODAY)

  it('accepts a negative balance (overdraft) and rejects a future date', () => {
    expect(errorsOf(schema, { date: '2026-11-03', balance: '-150.000' })).toEqual({})
    expect(errorsOf(schema, { date: '2026-12-01', balance: 'abc' })).toEqual({
      date: 'dateFuture',
      balance: 'amountInvalid',
    })
  })

  it('builds the request and its preview', () => {
    const input = toBankBalanceInput({ date: '2026-11-03', balance: '6.250.000,5' }, LOCALE)

    expect(input).toEqual({ date: '2026-11-03', balance: 6_250_000.5 })
    expect(anchorPreview(input)).toMatchObject({
      anchorAmount: 6_250_000.5,
      countsFrom: '2026-11-04',
    })
  })
})

describe('undoableAdjustmentId', () => {
  const adjustment = (id: string, revertedById: string | null = null) =>
    ({ id, revertedById }) as BalanceAdjustment

  it('only the newest, and only if it was not undone', () => {
    expect(undoableAdjustmentId([adjustment('revert'), adjustment('statement', 'revert')])).toBe(
      'revert',
    )
    expect(undoableAdjustmentId([adjustment('statement', 'revert')])).toBeNull()
    expect(undoableAdjustmentId([])).toBeNull()
  })
})

describe('anchorErrorMessages', () => {
  const GENERIC = { conflict: 'c', validation: 'v', notFound: 'n', unknown: 'u' }
  const error = (status: number) =>
    new AxiosError('x', undefined, undefined, undefined, {
      status,
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { statusCode: status },
    })
  const messages = anchorErrorMessages(GENERIC, {
    validation: 'fecha o monto',
    conflict: 'hay uno más nuevo',
    unknown: 'reintenta',
  })

  it.each([
    [400, 'fecha o monto'],
    [409, 'hay uno más nuevo'],
    [404, 'n'],
    [500, 'reintenta'],
  ])('%d → %s', (status, message) => {
    expect(apiErrorMessage(error(status), messages)).toBe(message)
  })
})
