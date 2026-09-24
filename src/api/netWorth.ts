import { parseAmount } from '@/lib/parseAmount'
import type { NetWorth } from '@/types'

import { apiClient } from './client'
import type { RawAmount } from './mappers'

interface RawNetWorth {
  assets: {
    accountsBalance: RawAmount
    receivables: RawAmount
    goalsSavings: RawAmount
    creditCardsAvailable: RawAmount
  }
  liabilities: {
    debts: RawAmount
    creditCardsDebt: RawAmount
  }
  netWorth: RawAmount
}

function toNetWorth(raw: RawNetWorth): NetWorth {
  return {
    assets: {
      accountsBalance: parseAmount(raw.assets.accountsBalance),
      receivables: parseAmount(raw.assets.receivables),
      goalsSavings: parseAmount(raw.assets.goalsSavings),
      creditCardsAvailable: parseAmount(raw.assets.creditCardsAvailable),
    },
    liabilities: {
      debts: parseAmount(raw.liabilities.debts),
      creditCardsDebt: parseAmount(raw.liabilities.creditCardsDebt),
    },
    netWorth: parseAmount(raw.netWorth),
  }
}

export interface NetWorthRepository {
  get(): Promise<NetWorth>
}

const httpNetWorthRepository: NetWorthRepository = {
  async get() {
    const { data } = await apiClient.get<RawNetWorth>('/net-worth')
    return toNetWorth(data)
  },
}

export const netWorthRepository: NetWorthRepository = httpNetWorthRepository
