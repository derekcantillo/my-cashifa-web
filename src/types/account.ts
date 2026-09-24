// Mirrors IAccountSummaryResponse / IAccountResponse (backend accounts module).
export type AccountType = 'DEBIT_CARD' | 'CREDIT_CARD' | 'CASH' | 'SAVINGS_ACCOUNT'

/** Embedded in each transaction — no balance. */
export interface AccountSummary {
  id: string
  name: string
  type: AccountType
  createdAt: string
  updatedAt: string
}

export interface Account extends AccountSummary {
  initialBalance: number
  /** Since when `initialBalance` applies; `null` means `currentBalance` sums the whole history. */
  initialBalanceDate: string | null
  currentBalance: number
}

export interface CreateAccountInput {
  name: string
  type: AccountType
}

export interface SetInitialBalanceInput {
  amount: number
  /** ISO date — required by the backend. */
  date: string
}
