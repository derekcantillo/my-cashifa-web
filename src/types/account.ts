// Mirrors IAccountSummaryResponse / IAccountResponse (backend accounts module).

/**
 * `DEBIT_CARD` only comes back on old accounts: the backend rejects it on create and
 * edit (a debit card is `hasDebitCard` of a bank account or wallet).
 */
export type AccountType =
  'SAVINGS_ACCOUNT' | 'CHECKING_ACCOUNT' | 'DIGITAL_WALLET' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD'

/** The types an account can be created with or changed to, in the order the forms show them. */
export const SELECTABLE_ACCOUNT_TYPES = [
  'SAVINGS_ACCOUNT',
  'CHECKING_ACCOUNT',
  'DIGITAL_WALLET',
  'CASH',
  'CREDIT_CARD',
] as const satisfies readonly AccountType[]
export type SelectableAccountType = (typeof SELECTABLE_ACCOUNT_TYPES)[number]

/** Types that can carry a debit card (the old `DEBIT_CARD` accounts too, while they exist). */
export const DEBIT_CARD_HOLDER_TYPES = [
  'SAVINGS_ACCOUNT',
  'CHECKING_ACCOUNT',
  'DIGITAL_WALLET',
  'DEBIT_CARD',
] as const satisfies readonly AccountType[]

/** Embedded in each transaction — no balance. */
export interface AccountSummary {
  id: string
  name: string
  type: AccountType
  createdAt: string
  updatedAt: string
}

export interface InstitutionRef {
  id: string
  name: string
}

/**
 * The `creditCard` block of a CREDIT_CARD account. Without a limit (`configured: false`)
 * its balance has no reliable sign, so `debt`, `available` and `overLimit` are `null`.
 */
export interface CreditCardState {
  configured: boolean
  creditLimit: number | null
  /** 1–31; 31 = last day of the month. */
  statementDay: number | null
  /** 1–31, of the month after the cut. */
  paymentDueDay: number | null
  /** % per month. */
  defaultMonthlyRate: number | null
  /** % effective per year, computed by the backend. */
  defaultEffectiveAnnualRate: number | null
  /** `max(0, −currentBalance)`. */
  debt: number | null
  /** `max(0, creditLimit − debt)`: never negative. */
  available: number | null
  /** `max(0, debt − creditLimit)`. */
  overLimit: number | null
  /** `YYYY-MM-DD` in Bogotá. */
  nextStatementDate: string | null
  nextPaymentDate: string | null
  /** Installment plans still running (0 until the backend has them). */
  activePlans: number
  /** Installment principal not billed yet; already inside `debt`. */
  remainingInstallmentPrincipal: number
}

export interface Account extends AccountSummary {
  initialBalance: number
  /** Since when `initialBalance` applies; `null` means `currentBalance` sums the whole history. */
  initialBalanceDate: string | null
  currentBalance: number
  /** `null`: no institution ("Sin entidad"). */
  institution: InstitutionRef | null
  hasDebitCard: boolean
  cardLast4: string | null
  /** Only on CREDIT_CARD accounts. */
  creditCard: CreditCardState | null
}

/** Card fields: only on CREDIT_CARD (the backend answers 400 on any other type). */
export interface CardSettingsInput {
  creditLimit?: number
  statementDay?: number
  paymentDueDay?: number
  defaultMonthlyRate?: number
}

export interface CreateAccountInput extends CardSettingsInput {
  name: string
  type: SelectableAccountType
  institutionId?: string
  hasDebitCard?: boolean
  cardLast4?: string
}

/** Everything optional; `null` clears (unlinks the institution, removes the digits…). */
export interface UpdateAccountInput {
  name?: string
  type?: SelectableAccountType
  institutionId?: string | null
  hasDebitCard?: boolean
  cardLast4?: string | null
  creditLimit?: number | null
  statementDay?: number | null
  paymentDueDay?: number | null
  defaultMonthlyRate?: number | null
}

export interface SetInitialBalanceInput {
  amount: number
  /** ISO date — required by the backend. */
  date: string
}

/**
 * POST /accounts/:id/statement-balance. The backend anchors the balance at 00:00 Bogotá
 * of the day after the given date: everything from that day is already inside.
 */
export type StatementBalanceInput =
  /** Credit card: what's owed at the cut (≥ 0), optionally setting the limit too. */
  | { cutDate: string; totalDebt: number; creditLimit?: number }
  /** Any other account: the bank's balance at the end of that day (may be negative). */
  | { date: string; balance: number }

export type BalanceAdjustmentReason = 'STATEMENT' | 'INITIAL_BALANCE' | 'REVERT'

/** One change of an account's anchor (`initialBalance` + date), with what it replaced. */
export interface BalanceAdjustment {
  id: string
  accountId: string
  reason: BalanceAdjustmentReason
  oldAmount: number
  oldDate: string | null
  newAmount: number
  newDate: string | null
  oldCreditLimit: number | null
  newCreditLimit: number | null
  /** `YYYY-MM-DD` of the statement or bank balance; only on STATEMENT. */
  statementDate: string | null
  /** `currentBalance` right before and right after (a snapshot of that moment). */
  balanceBefore: number
  balanceAfter: number
  /** On a REVERT, the adjustment it undid. */
  revertsId: string | null
  /** The REVERT that undid this one, if any. */
  revertedById: string | null
  createdAt: string
}

/** Answer of statement-balance and revert: the adjusted account and its record. */
export interface BalanceAdjustmentResult {
  account: Account
  adjustment: BalanceAdjustment
}

// Mirrors IInstitutionResponse (backend institutions module).
export interface Institution {
  id: string
  name: string
  /** Accounts linked to it. */
  accountCount: number
  createdAt: string
  updatedAt: string
}
