import { parseAmount } from '@/lib/parseAmount'
import type { NetWorth } from '@/types'

import { apiClient } from './client'
import type { RawAmount } from './mappers'

// `assets.goalsSavings` and `assets.creditCardsAvailable` also come back, deprecated (kept for
// the mobile app): the web reads them from `info`, where they don't add up.
interface RawNetWorth {
  assets: {
    accountsBalance: RawAmount
    receivables: RawAmount
  }
  liabilities: {
    debts: RawAmount
    creditCardsDebt: RawAmount
  }
  info: {
    goalsSavings: RawAmount
    creditCardsAvailable: RawAmount
    unconfiguredCards: { id: string; name: string; currentBalance: RawAmount }[]
  }
  totals: {
    assets: RawAmount
    liabilities: RawAmount
  }
  netWorth: RawAmount
}

function toNetWorth(raw: RawNetWorth): NetWorth {
  return {
    assets: {
      accountsBalance: parseAmount(raw.assets.accountsBalance),
      receivables: parseAmount(raw.assets.receivables),
    },
    liabilities: {
      debts: parseAmount(raw.liabilities.debts),
      creditCardsDebt: parseAmount(raw.liabilities.creditCardsDebt),
    },
    info: {
      goalsSavings: parseAmount(raw.info.goalsSavings),
      creditCardsAvailable: parseAmount(raw.info.creditCardsAvailable),
      unconfiguredCards: raw.info.unconfiguredCards.map(card => ({
        id: card.id,
        name: card.name,
        currentBalance: parseAmount(card.currentBalance),
      })),
    },
    totals: {
      assets: parseAmount(raw.totals.assets),
      liabilities: parseAmount(raw.totals.liabilities),
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
