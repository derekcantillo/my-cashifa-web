import { parseAmount } from '@/lib/parseAmount'
import type { PeriodLedger } from '@/types'

import { apiClient } from './client'
import type { RawAmount } from './mappers'

interface RawPeriodLedger {
  id: string
  periodId: string
  periodLabel: string
  openingBalance: RawAmount
  income: RawAmount
  expenses: RawAmount
  savings: RawAmount
  closingBalance: RawAmount
  availableToSpend: RawAmount
}

function toPeriodLedger(raw: RawPeriodLedger): PeriodLedger {
  return {
    id: raw.id,
    periodId: raw.periodId,
    periodLabel: raw.periodLabel,
    openingBalance: parseAmount(raw.openingBalance),
    income: parseAmount(raw.income),
    expenses: parseAmount(raw.expenses),
    savings: parseAmount(raw.savings),
    closingBalance: parseAmount(raw.closingBalance),
    availableToSpend: parseAmount(raw.availableToSpend),
  }
}

export interface PeriodLedgerRepository {
  getByPeriod(periodId: string): Promise<PeriodLedger>
}

const httpPeriodLedgerRepository: PeriodLedgerRepository = {
  async getByPeriod(periodId) {
    const { data } = await apiClient.get<RawPeriodLedger>('/period-ledger', {
      params: { periodId },
    })
    return toPeriodLedger(data)
  },
}

export const periodLedgerRepository: PeriodLedgerRepository = httpPeriodLedgerRepository
