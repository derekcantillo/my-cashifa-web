import { z } from 'zod'

import { fromDateInputValue, parseAmountInput, toDateInputValue } from '@/lib/format'
import type {
  AccountSummary,
  CreateTransferInput,
  Transaction,
  UpdateTransactionInput,
} from '@/types'

/** Same limit as the backend DTO (`@MaxLength(255)` on `description`). */
export const TRANSFER_NOTE_MAX_LENGTH = 255

export type TransferErrorCode =
  | 'originRequired'
  | 'destinationRequired'
  | 'sameAccount'
  | 'amountRequired'
  | 'amountInvalid'
  | 'amountPositive'
  | 'dateRequired'
  | 'noteTooLong'

/** Error messages are codes (`TransferErrorCode`), translated by the form. */
export function createTransferSchema(locale: string) {
  return z
    .object({
      accountId: z.string().min(1, { error: 'originRequired' }),
      toAccountId: z.string().min(1, { error: 'destinationRequired' }),
      amount: z
        .string()
        .trim()
        .min(1, { error: 'amountRequired' })
        .refine(value => !Number.isNaN(parseAmountInput(value, locale)), {
          error: 'amountInvalid',
        })
        .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' }),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'dateRequired' }),
      description: z.string().trim().max(TRANSFER_NOTE_MAX_LENGTH, { error: 'noteTooLong' }),
    })
    .refine(values => !values.accountId || values.accountId !== values.toAccountId, {
      path: ['toAccountId'],
      error: 'sameAccount',
    })
}

export type TransferFormValues = z.input<ReturnType<typeof createTransferSchema>>

/** Credit cards are the destination of a card payment, never its origin by default. */
const isCard = (account: Pick<AccountSummary, 'type'>) => account.type === 'CREDIT_CARD'

export interface TransferPreset {
  /** Start with this destination (e.g. the card picked in "Pagar tarjeta"). */
  toAccountId?: string
  /** "Pagar tarjeta": the destination is the first credit card unless one is given. */
  cardPayment?: boolean
}

/**
 * Starting values of a new transfer. The origin is the first account that isn't a credit
 * card (where money usually comes from); the destination is the preset one, the first
 * card for a card payment, or empty for the user to pick.
 */
export function transferDefaults(
  accounts: readonly Pick<AccountSummary, 'id' | 'type'>[],
  preset: TransferPreset = {},
  today = toDateInputValue(),
): TransferFormValues {
  const toAccountId =
    preset.toAccountId ?? (preset.cardPayment ? accounts.find(isCard)?.id : undefined) ?? ''
  const origin = accounts.find(account => !isCard(account) && account.id !== toAccountId)
  return {
    accountId: origin?.id ?? '',
    toAccountId,
    amount: '',
    date: today,
    description: '',
  }
}

/** POST body of a new transfer from validated values. */
export function toCreateTransferInput(
  values: TransferFormValues,
  locale: string,
): CreateTransferInput {
  const description = values.description.trim()
  return {
    type: 'TRANSFER',
    accountId: values.accountId,
    toAccountId: values.toAccountId,
    amount: parseAmountInput(values.amount, locale),
    transactionDate: fromDateInputValue(values.date),
    ...(description ? { description } : {}),
  }
}

/**
 * PATCH body with only what the user changed (an untouched date keeps its time). Never
 * sends `type`: a transfer can't become another kind of movement.
 */
export function toUpdateTransferInput(
  values: TransferFormValues,
  dirty: Partial<Record<keyof TransferFormValues, boolean | undefined>>,
  locale: string,
): UpdateTransactionInput {
  return {
    ...(dirty.accountId ? { accountId: values.accountId } : {}),
    ...(dirty.toAccountId ? { toAccountId: values.toAccountId } : {}),
    ...(dirty.amount ? { amount: parseAmountInput(values.amount, locale) } : {}),
    ...(dirty.date ? { transactionDate: fromDateInputValue(values.date) } : {}),
    ...(dirty.description ? { description: values.description.trim() } : {}),
  }
}

/** Form values of an existing transfer. */
export function transferValuesOf(
  transaction: Pick<Transaction, 'accountId' | 'toAccountId' | 'transactionDate' | 'description'>,
  amount: string,
): TransferFormValues {
  return {
    accountId: transaction.accountId ?? '',
    toAccountId: transaction.toAccountId ?? '',
    amount,
    date: toDateInputValue(transaction.transactionDate),
    description: transaction.description ?? '',
  }
}
