import { z } from 'zod'

import { formatAmountInput, parseAmountInput, parseSignedAmountInput } from '@/lib/format'
import {
  DEBIT_CARD_HOLDER_TYPES,
  SELECTABLE_ACCOUNT_TYPES,
  type Account,
  type AccountType,
  type CreateAccountInput,
  type Institution,
  type SelectableAccountType,
  type StatementBalanceInput,
  type UpdateAccountInput,
} from '@/types'

/** Same limits as the backend DTOs. */
export const ACCOUNT_NAME_MAX_LENGTH = 80
export const INSTITUTION_NAME_MAX_LENGTH = 80
export const MAX_MONTHLY_RATE = 100

/** Value of the institution picker that reveals the "new institution" field. */
export const NEW_INSTITUTION = '__new__'

export type AccountFormErrorCode =
  | 'nameRequired'
  | 'nameTooLong'
  | 'institutionNameRequired'
  | 'institutionNameTooLong'
  | 'cardLast4Invalid'
  | 'cardLast4NeedsCard'
  | 'amountRequired'
  | 'amountInvalid'
  | 'limitInvalid'
  | 'dayInvalid'
  | 'rateInvalid'
  | 'statementIncomplete'
  | 'debtInvalid'
  | 'dateFuture'

export const isCardType = (type: AccountType) => type === 'CREDIT_CARD'
export const canHaveDebitCard = (type: AccountType) =>
  (DEBIT_CARD_HOLDER_TYPES as readonly AccountType[]).includes(type)

/**
 * A monthly rate as typed: "2,1155" or "2.1155" (a rate has no thousands, so both marks
 * are the decimal one), up to 4 decimals. `NaN` when it isn't one.
 */
export function parseRateInput(value: string): number {
  const cleaned = value.trim().replace('%', '').trim().replace(',', '.')
  return /^\d+(\.\d{1,4})?$/.test(cleaned) ? Number(cleaned) : NaN
}

export function formatRateInput(rate: number, locale: string): string {
  const text = String(rate)
  return locale.startsWith('es') ? text.replace('.', ',') : text
}

const optionalDay = z
  .string()
  .refine(value => value === '' || (/^\d+$/.test(value) && +value >= 1 && +value <= 31), {
    error: 'dayInvalid',
  })

/**
 * Create and edit. Error messages are codes (`AccountFormErrorCode`). Card fields,
 * the debit card and the digits only matter for the types that have them; the
 * request builders drop the rest.
 */
export function createAccountSchema(locale: string, today: string) {
  const optionalPositive = z
    .string()
    .trim()
    .refine(value => value === '' || parseAmountInput(value, locale) > 0, {
      error: 'limitInvalid',
    })
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { error: 'nameRequired' })
        .max(ACCOUNT_NAME_MAX_LENGTH, { error: 'nameTooLong' }),
      type: z.enum(SELECTABLE_ACCOUNT_TYPES),
      /** '' = no institution, an id, or `NEW_INSTITUTION`. */
      institutionChoice: z.string(),
      newInstitutionName: z
        .string()
        .trim()
        .max(INSTITUTION_NAME_MAX_LENGTH, { error: 'institutionNameTooLong' }),
      hasDebitCard: z.boolean(),
      cardLast4: z
        .string()
        .trim()
        .refine(value => value === '' || /^\d{4}$/.test(value), { error: 'cardLast4Invalid' }),
      /** Create only, not for cards: the balance as of today (may be negative). */
      initialBalance: z
        .string()
        .trim()
        .refine(value => value === '' || !Number.isNaN(parseSignedAmountInput(value, locale)), {
          error: 'amountInvalid',
        }),
      creditLimit: optionalPositive,
      statementDay: optionalDay,
      paymentDueDay: optionalDay,
      monthlyRate: z
        .string()
        .trim()
        .refine(
          value =>
            value === '' ||
            (!Number.isNaN(parseRateInput(value)) && parseRateInput(value) <= MAX_MONTHLY_RATE),
          { error: 'rateInvalid' },
        ),
      /** Create a card only: its last statement, to start with the real debt. */
      statementCutDate: z.string().refine(value => value === '' || value <= today, {
        error: 'dateFuture',
      }),
      statementDebt: z
        .string()
        .trim()
        .refine(value => value === '' || !Number.isNaN(parseAmountInput(value, locale)), {
          error: 'debtInvalid',
        }),
    })
    .superRefine((values, context) => {
      if (values.institutionChoice === NEW_INSTITUTION && values.newInstitutionName === '') {
        context.addIssue({
          code: 'custom',
          path: ['newInstitutionName'],
          message: 'institutionNameRequired',
        })
      }
      const hasCard =
        isCardType(values.type) || (canHaveDebitCard(values.type) && values.hasDebitCard)
      if (values.cardLast4 !== '' && !hasCard) {
        context.addIssue({ code: 'custom', path: ['cardLast4'], message: 'cardLast4NeedsCard' })
      }
      if (
        isCardType(values.type) &&
        (values.statementCutDate === '') !== (values.statementDebt === '')
      ) {
        context.addIssue({
          code: 'custom',
          path: [values.statementCutDate === '' ? 'statementCutDate' : 'statementDebt'],
          message: 'statementIncomplete',
        })
      }
    })
}

export type AccountFormValues = z.input<ReturnType<typeof createAccountSchema>>

/** An old `DEBIT_CARD` account opens as a savings account with its debit card (E.3). */
function editableType(type: AccountType): SelectableAccountType {
  return type === 'DEBIT_CARD' ? 'SAVINGS_ACCOUNT' : type
}

export function accountFormDefaults(
  account: Account | undefined,
  locale: string,
): AccountFormValues {
  const card = account?.creditCard
  const optional = (value: number | null | undefined, format: (value: number) => string) =>
    value === null || value === undefined ? '' : format(value)
  return {
    name: account?.name ?? '',
    type: account ? editableType(account.type) : 'SAVINGS_ACCOUNT',
    institutionChoice: account?.institution?.id ?? '',
    newInstitutionName: '',
    hasDebitCard: account ? account.hasDebitCard || account.type === 'DEBIT_CARD' : false,
    cardLast4: account?.cardLast4 ?? '',
    initialBalance: '',
    creditLimit: optional(card?.creditLimit, value => formatAmountInput(value, locale)),
    statementDay: optional(card?.statementDay, String),
    paymentDueDay: optional(card?.paymentDueDay, String),
    monthlyRate: optional(card?.defaultMonthlyRate, value => formatRateInput(value, locale)),
    statementCutDate: '',
    statementDebt: '',
  }
}

/** An existing institution with that name, ignoring case and spaces (the backend's 409 rule). */
export function findInstitutionByName(
  institutions: readonly Pick<Institution, 'id' | 'name'>[],
  name: string,
): Pick<Institution, 'id' | 'name'> | undefined {
  const wanted = name.trim().toLocaleLowerCase()
  return institutions.find(item => item.name.trim().toLocaleLowerCase() === wanted)
}

/**
 * The first credit limit of a card that already has a balance goes through "Ajustar al
 * extracto" (limit and debt together): the backend refuses it on PATCH, because that
 * balance isn't a debt yet (the TC VISA held the available credit).
 */
export function limitNeedsStatement(account: Account | undefined): boolean {
  return Boolean(
    account &&
    account.type === 'CREDIT_CARD' &&
    !account.creditCard?.configured &&
    (account.initialBalance !== 0 || account.currentBalance !== 0),
  )
}

interface CardFields {
  creditLimit: number | null
  statementDay: number | null
  paymentDueDay: number | null
  defaultMonthlyRate: number | null
}

function cardFieldsOf(values: AccountFormValues, locale: string): CardFields {
  const number = (value: string, parse: (value: string) => number) =>
    value.trim() === '' ? null : parse(value)
  return {
    creditLimit: number(values.creditLimit, value => parseAmountInput(value, locale)),
    statementDay: number(values.statementDay, Number),
    paymentDueDay: number(values.paymentDueDay, Number),
    defaultMonthlyRate: number(values.monthlyRate, parseRateInput),
  }
}

/** What the debit card switch and the digits mean for the chosen type. */
function productFieldsOf(values: AccountFormValues) {
  const hasDebitCard = canHaveDebitCard(values.type) && values.hasDebitCard
  const keepsDigits = isCardType(values.type) || hasDebitCard
  return {
    hasDebitCard,
    cardLast4: keepsDigits && values.cardLast4 !== '' ? values.cardLast4 : null,
  }
}

export function toCreateAccountInput(
  values: AccountFormValues,
  locale: string,
  institutionId: string | null,
): CreateAccountInput {
  const { hasDebitCard, cardLast4 } = productFieldsOf(values)
  const input: CreateAccountInput = { name: values.name.trim(), type: values.type }
  if (institutionId) input.institutionId = institutionId
  if (hasDebitCard) input.hasDebitCard = true
  if (cardLast4) input.cardLast4 = cardLast4
  if (isCardType(values.type)) {
    for (const [key, value] of Object.entries(cardFieldsOf(values, locale))) {
      if (value !== null) input[key as keyof CardFields] = value
    }
  }
  return input
}

/** Only what changed. Leaving the card type clears its card fields (the backend requires it). */
export function toUpdateAccountInput(
  values: AccountFormValues,
  account: Account,
  locale: string,
  institutionId: string | null,
): UpdateAccountInput {
  const input: UpdateAccountInput = {}
  const name = values.name.trim()
  if (name !== account.name) input.name = name
  if (values.type !== account.type) input.type = values.type
  if (institutionId !== (account.institution?.id ?? null)) input.institutionId = institutionId

  const { hasDebitCard, cardLast4 } = productFieldsOf(values)
  if (hasDebitCard !== account.hasDebitCard) input.hasDebitCard = hasDebitCard
  if (cardLast4 !== account.cardLast4) input.cardLast4 = cardLast4

  const card = account.creditCard
  const current: CardFields = {
    creditLimit: card?.creditLimit ?? null,
    statementDay: card?.statementDay ?? null,
    paymentDueDay: card?.paymentDueDay ?? null,
    defaultMonthlyRate: card?.defaultMonthlyRate ?? null,
  }
  const next: CardFields = isCardType(values.type)
    ? cardFieldsOf(values, locale)
    : { creditLimit: null, statementDay: null, paymentDueDay: null, defaultMonthlyRate: null }
  for (const key of Object.keys(next) as (keyof CardFields)[]) {
    if (next[key] !== current[key]) input[key] = next[key]
  }
  return input
}

/** A new card's last statement, sent right after creating it; `null` if not given. */
export function initialStatementOf(
  values: AccountFormValues,
  locale: string,
): StatementBalanceInput | null {
  if (!isCardType(values.type) || values.statementCutDate === '' || values.statementDebt === '') {
    return null
  }
  return {
    cutDate: values.statementCutDate,
    totalDebt: parseAmountInput(values.statementDebt, locale),
  }
}

/** A new non-card account's balance as of today; `null` when it's 0 or empty. */
export function initialBalanceOf(values: AccountFormValues, locale: string): number | null {
  if (isCardType(values.type) || values.initialBalance.trim() === '') return null
  const amount = parseSignedAmountInput(values.initialBalance, locale)
  return amount === 0 ? null : amount
}
