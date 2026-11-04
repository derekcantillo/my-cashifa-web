import { parseAmount } from '@/lib/parseAmount'
import type {
  Account,
  AccountSummary,
  BalanceAdjustment,
  BalanceAdjustmentResult,
  CreateAccountInput,
  CreditCardState,
  SetInitialBalanceInput,
  StatementBalanceInput,
  UpdateAccountInput,
} from '@/types'

import { apiClient } from './client'
import type { RawAmount } from './mappers'

export type RawAccountSummary = AccountSummary

type RawMoney = RawAmount | null

interface RawCreditCard extends Omit<
  CreditCardState,
  | 'creditLimit'
  | 'debt'
  | 'available'
  | 'overLimit'
  | 'activePlans'
  | 'remainingInstallmentPrincipal'
> {
  creditLimit: RawMoney
  debt: RawMoney
  available: RawMoney
  overLimit: RawMoney
  /** Missing on a backend without installment plans (step 5). */
  activePlans?: number
  remainingInstallmentPrincipal?: RawAmount
}

interface RawAccount extends RawAccountSummary {
  initialBalance: RawAmount
  initialBalanceDate: string | null
  currentBalance: RawAmount
  institution: Account['institution']
  hasDebitCard: boolean
  cardLast4: string | null
  creditCard: RawCreditCard | null
}

interface RawBalanceAdjustment extends Omit<
  BalanceAdjustment,
  'oldAmount' | 'newAmount' | 'oldCreditLimit' | 'newCreditLimit' | 'balanceBefore' | 'balanceAfter'
> {
  oldAmount: RawAmount
  newAmount: RawAmount
  oldCreditLimit: RawMoney
  newCreditLimit: RawMoney
  balanceBefore: RawAmount
  balanceAfter: RawAmount
}

interface RawBalanceAdjustmentResult {
  account: RawAccount
  adjustment: RawBalanceAdjustment
}

const parseMoney = (value: RawMoney): number | null => (value === null ? null : parseAmount(value))

function toCreditCard(raw: RawCreditCard): CreditCardState {
  return {
    ...raw,
    creditLimit: parseMoney(raw.creditLimit),
    debt: parseMoney(raw.debt),
    available: parseMoney(raw.available),
    overLimit: parseMoney(raw.overLimit),
    activePlans: raw.activePlans ?? 0,
    remainingInstallmentPrincipal: parseAmount(raw.remainingInstallmentPrincipal ?? 0),
  }
}

export function toAccount(raw: RawAccount): Account {
  return {
    ...raw,
    initialBalance: parseAmount(raw.initialBalance),
    currentBalance: parseAmount(raw.currentBalance),
    // Older backends (before "Mis productos") don't send these.
    institution: raw.institution ?? null,
    hasDebitCard: raw.hasDebitCard ?? false,
    cardLast4: raw.cardLast4 ?? null,
    creditCard: raw.creditCard ? toCreditCard(raw.creditCard) : null,
  }
}

export function toBalanceAdjustment(raw: RawBalanceAdjustment): BalanceAdjustment {
  return {
    ...raw,
    oldAmount: parseAmount(raw.oldAmount),
    newAmount: parseAmount(raw.newAmount),
    oldCreditLimit: parseMoney(raw.oldCreditLimit),
    newCreditLimit: parseMoney(raw.newCreditLimit),
    balanceBefore: parseAmount(raw.balanceBefore),
    balanceAfter: parseAmount(raw.balanceAfter),
  }
}

function toResult(raw: RawBalanceAdjustmentResult): BalanceAdjustmentResult {
  return { account: toAccount(raw.account), adjustment: toBalanceAdjustment(raw.adjustment) }
}

export interface AccountsRepository {
  list(): Promise<Account[]>
  create(input: CreateAccountInput): Promise<Account>
  update(id: string, input: UpdateAccountInput): Promise<Account>
  setInitialBalance(id: string, input: SetInitialBalanceInput): Promise<Account>
  anchorToStatement(id: string, input: StatementBalanceInput): Promise<BalanceAdjustmentResult>
  listAdjustments(id: string): Promise<BalanceAdjustment[]>
  revertAdjustment(id: string, adjustmentId: string): Promise<BalanceAdjustmentResult>
}

const httpAccountsRepository: AccountsRepository = {
  async list() {
    const { data } = await apiClient.get<RawAccount[]>('/accounts')
    return data.map(toAccount)
  },
  async create(input) {
    const { data } = await apiClient.post<RawAccount>('/accounts', input)
    return toAccount(data)
  },
  async update(id, input) {
    const { data } = await apiClient.patch<RawAccount>(`/accounts/${id}`, input)
    return toAccount(data)
  },
  async setInitialBalance(id, input) {
    const { data } = await apiClient.patch<RawAccount>(`/accounts/${id}/initial-balance`, input)
    return toAccount(data)
  },
  async anchorToStatement(id, input) {
    const { data } = await apiClient.post<RawBalanceAdjustmentResult>(
      `/accounts/${id}/statement-balance`,
      input,
    )
    return toResult(data)
  },
  async listAdjustments(id) {
    const { data } = await apiClient.get<RawBalanceAdjustment[]>(
      `/accounts/${id}/balance-adjustments`,
    )
    return data.map(toBalanceAdjustment)
  },
  async revertAdjustment(id, adjustmentId) {
    const { data } = await apiClient.post<RawBalanceAdjustmentResult>(
      `/accounts/${id}/balance-adjustments/${adjustmentId}/revert`,
    )
    return toResult(data)
  },
}

export const accountsRepository: AccountsRepository = httpAccountsRepository
