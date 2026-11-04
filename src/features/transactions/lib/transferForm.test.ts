import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { apiErrorMessage } from '@/lib/apiError'

import {
  createTransferSchema,
  toCreateTransferInput,
  toUpdateTransferInput,
  transferDefaults,
  transferSaveErrorMessages,
  type TransferFormValues,
} from './transferForm'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

const ACCOUNTS = [
  { id: 'visa', type: 'CREDIT_CARD' as const },
  { id: 'savings', type: 'DEBIT_CARD' as const },
  { id: 'nequi', type: 'SAVINGS_ACCOUNT' as const },
  { id: 'davivienda', type: 'CREDIT_CARD' as const },
]

const VALID: TransferFormValues = {
  accountId: 'savings',
  toAccountId: 'visa',
  amount: '838.675',
  date: '2026-10-04',
  description: '',
}

/** First issue per field, like react-hook-form shows it. */
const errorsOf = (values: TransferFormValues) => {
  const result = createTransferSchema('es-CO').safeParse(values)
  const errors: Record<string, string> = {}
  if (result.success) return errors
  for (const issue of result.error.issues) errors[issue.path.join('.')] ??= issue.message
  return errors
}

describe('transfer form validation', () => {
  it('accepts two different accounts and a positive amount', () => {
    expect(errorsOf(VALID)).toEqual({})
  })

  it('rejects the same account as origin and destination', () => {
    expect(errorsOf({ ...VALID, toAccountId: 'savings' })).toEqual({ toAccountId: 'sameAccount' })
  })

  it('reports the same account together with other errors', () => {
    expect(errorsOf({ ...VALID, toAccountId: 'savings', amount: '' })).toEqual({
      amount: 'amountRequired',
      toAccountId: 'sameAccount',
    })
  })

  it('requires both accounts', () => {
    expect(errorsOf({ ...VALID, accountId: '', toAccountId: '' })).toEqual({
      accountId: 'originRequired',
      toAccountId: 'destinationRequired',
    })
  })

  it.each([
    ['', 'amountRequired'],
    ['abc', 'amountInvalid'],
    ['0', 'amountPositive'],
  ])('rejects the amount %j', (amount, code) => {
    expect(errorsOf({ ...VALID, amount })).toEqual({ amount: code })
  })
})

describe('transfer defaults', () => {
  it('a card payment goes from the first non-card account to the first card', () => {
    expect(transferDefaults(ACCOUNTS, { cardPayment: true }, '2026-11-17')).toMatchObject({
      accountId: 'savings',
      toAccountId: 'visa',
      date: '2026-11-17',
    })
  })

  it('keeps the card picked by the user', () => {
    expect(
      transferDefaults(ACCOUNTS, { cardPayment: true, toAccountId: 'davivienda' }),
    ).toMatchObject({ accountId: 'savings', toAccountId: 'davivienda' })
  })

  it('a plain transfer leaves the destination for the user', () => {
    expect(transferDefaults(ACCOUNTS)).toMatchObject({ accountId: 'savings', toAccountId: '' })
  })

  it('never preselects the destination as origin', () => {
    expect(transferDefaults(ACCOUNTS, { toAccountId: 'savings' })).toMatchObject({
      accountId: 'nequi',
      toAccountId: 'savings',
    })
  })

  it('works without accounts', () => {
    expect(transferDefaults([], { cardPayment: true })).toMatchObject({
      accountId: '',
      toAccountId: '',
    })
  })
})

describe('transfer requests', () => {
  it('POST sends type TRANSFER, both accounts and no category', () => {
    const input = toCreateTransferInput({ ...VALID, description: '  Pago TC  ' }, 'es-CO')
    expect(input).toEqual({
      type: 'TRANSFER',
      accountId: 'savings',
      toAccountId: 'visa',
      amount: 838_675,
      transactionDate: '2026-10-04T17:00:00.000Z',
      description: 'Pago TC',
    })
    expect(input).not.toHaveProperty('category')
  })

  it('PATCH sends only what changed and never the type', () => {
    const input = toUpdateTransferInput(
      { ...VALID, toAccountId: 'nequi', amount: '1.033.737' },
      { toAccountId: true, amount: true },
      'es-CO',
    )
    expect(input).toEqual({ toAccountId: 'nequi', amount: 1_033_737 })
  })
})

describe('transfer save errors', () => {
  const httpError = (status: number) => {
    const config = { headers: new AxiosHeaders() }
    return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
      status,
      statusText: '',
      headers: {},
      config,
      data: { success: false, statusCode: status },
    })
  }
  const messages = transferSaveErrorMessages(
    { conflict: 'conflict', validation: 'generic 400', notFound: 'gone', unknown: 'generic' },
    { validation: 'check the accounts', unknown: 'transfer failed' },
  )

  it('explains a 400 in terms of the two accounts', () => {
    expect(apiErrorMessage(httpError(400), messages)).toBe('check the accounts')
  })

  it('keeps the generic message for a deleted transfer and its own for the rest', () => {
    expect(apiErrorMessage(httpError(404), messages)).toBe('gone')
    expect(apiErrorMessage(httpError(500), messages)).toBe('transfer failed')
    expect(apiErrorMessage(null, messages)).toBeNull()
  })
})
