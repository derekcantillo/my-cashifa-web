import { z } from 'zod'

import type { ApiErrorMessages } from '@/lib/apiError'
import {
  addDaysToDateKey,
  formatAmountInput,
  parseAmountInput,
  parseSignedAmountInput,
  toDateInputValue,
} from '@/lib/format'
import type { Account, BalanceAdjustment, StatementBalanceInput } from '@/types'

export type AnchorErrorCode =
  | 'dateRequired'
  | 'dateFuture'
  | 'amountRequired'
  | 'amountInvalid'
  | 'limitRequired'
  | 'limitInvalid'

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

const pastDate = (today: string) =>
  z
    .string()
    .regex(DATE_KEY, { error: 'dateRequired' })
    .refine(value => value <= today, { error: 'dateFuture' })

/**
 * "Ajustar al extracto" of a card: cut date, what's owed at the cut (≥ 0) and the limit.
 * The limit is required while the card has none: the statement is what configures it.
 */
export function createCardStatementSchema(locale: string, today: string, limitRequired: boolean) {
  return z.object({
    cutDate: pastDate(today),
    totalDebt: z
      .string()
      .trim()
      .min(1, { error: 'amountRequired' })
      .refine(value => !Number.isNaN(parseAmountInput(value, locale)), { error: 'amountInvalid' }),
    creditLimit: z
      .string()
      .trim()
      .refine(value => !limitRequired || value !== '', { error: 'limitRequired' })
      .refine(value => value === '' || parseAmountInput(value, locale) > 0, {
        error: 'limitInvalid',
      }),
  })
}

/** "Ajustar al saldo del banco" of any other account: a date and the balance (may be negative). */
export function createBankBalanceSchema(locale: string, today: string) {
  return z.object({
    date: pastDate(today),
    balance: z
      .string()
      .trim()
      .min(1, { error: 'amountRequired' })
      .refine(value => !Number.isNaN(parseSignedAmountInput(value, locale)), {
        error: 'amountInvalid',
      }),
  })
}

export type CardStatementValues = z.input<ReturnType<typeof createCardStatementSchema>>
export type BankBalanceValues = z.input<ReturnType<typeof createBankBalanceSchema>>

export function cardStatementDefaults(account: Account, locale: string): CardStatementValues {
  const limit = account.creditCard?.creditLimit
  return {
    cutDate: '',
    totalDebt: '',
    creditLimit: limit === null || limit === undefined ? '' : formatAmountInput(limit, locale),
  }
}

export const bankBalanceDefaults = (): BankBalanceValues => ({
  date: toDateInputValue(),
  balance: '',
})

/** The limit only goes when it changes (or the card has none yet). */
export function toCardStatementInput(
  values: CardStatementValues,
  account: Account,
  locale: string,
): StatementBalanceInput {
  const input: StatementBalanceInput = {
    cutDate: values.cutDate,
    totalDebt: parseAmountInput(values.totalDebt, locale),
  }
  if (values.creditLimit.trim() !== '') {
    const limit = parseAmountInput(values.creditLimit, locale)
    if (limit !== account.creditCard?.creditLimit) input.creditLimit = limit
  }
  return input
}

export function toBankBalanceInput(
  values: BankBalanceValues,
  locale: string,
): StatementBalanceInput {
  return { date: values.date, balance: parseSignedAmountInput(values.balance, locale) }
}

/**
 * What the review step explains before confirming: the new anchor (a card's balance is
 * −debt), and the first day whose movements count on top of it (the day after the cut:
 * everything from the cut day is already inside the statement).
 */
export function anchorPreview(input: StatementBalanceInput): {
  anchorAmount: number
  statementDate: string
  countsFrom: string
} {
  const statementDate = 'cutDate' in input ? input.cutDate : input.date
  return {
    anchorAmount: 'cutDate' in input ? -input.totalDebt : input.balance,
    statementDate,
    countsFrom: addDaysToDateKey(statementDate, 1),
  }
}

/**
 * Only the newest adjustment can be undone, and only once: the backend restores an
 * anchor only while it is the current one (409 otherwise).
 */
export function undoableAdjustmentId(history: readonly BalanceAdjustment[]): string | null {
  const [newest] = history
  return newest && newest.revertedById === null ? newest.id : null
}

/** Save errors by status: 400 a date or amount the backend rejected; 409 an undo too late. */
export function anchorErrorMessages(
  generic: ApiErrorMessages,
  messages: { validation: string; conflict: string; unknown: string },
): ApiErrorMessages {
  return { ...generic, ...messages }
}
