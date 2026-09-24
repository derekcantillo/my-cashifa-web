import { parseAmount } from '@/lib/parseAmount'
import type { Account, AccountSummary, CreateAccountInput, SetInitialBalanceInput } from '@/types'

import { apiClient } from './client'
import type { RawAmount } from './mappers'

export type RawAccountSummary = AccountSummary

interface RawAccount extends RawAccountSummary {
  initialBalance: RawAmount
  initialBalanceDate: string | null
  currentBalance: RawAmount
}

function toAccount(raw: RawAccount): Account {
  return {
    ...raw,
    initialBalance: parseAmount(raw.initialBalance),
    currentBalance: parseAmount(raw.currentBalance),
  }
}

export interface AccountsRepository {
  list(): Promise<Account[]>
  create(input: CreateAccountInput): Promise<Account>
  setInitialBalance(id: string, input: SetInitialBalanceInput): Promise<Account>
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
  async setInitialBalance(id, input) {
    const { data } = await apiClient.patch<RawAccount>(`/accounts/${id}/initial-balance`, input)
    return toAccount(data)
  },
}

export const accountsRepository: AccountsRepository = httpAccountsRepository
