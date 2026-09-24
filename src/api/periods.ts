import type { FinancialPeriod } from '@/types'

import { apiClient } from './client'

interface RawFinancialPeriod {
  id: string
  label: string
  startDate: string
  endDate: string | null
}

function toFinancialPeriod(raw: RawFinancialPeriod): FinancialPeriod {
  return { ...raw, isCurrent: raw.endDate === null }
}

export interface PeriodsRepository {
  list(): Promise<FinancialPeriod[]>
  getCurrent(): Promise<FinancialPeriod>
}

const httpPeriodsRepository: PeriodsRepository = {
  async list() {
    const { data } = await apiClient.get<RawFinancialPeriod[]>('/financial-periods')
    return data.map(toFinancialPeriod)
  },
  async getCurrent() {
    const { data } = await apiClient.get<RawFinancialPeriod>('/financial-periods/current')
    return toFinancialPeriod(data)
  },
}

export const periodsRepository: PeriodsRepository = httpPeriodsRepository
