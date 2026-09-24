import { parseAmount } from '@/lib/parseAmount'
import type { DistributionItem, ReportSummary, SavingsProjection } from '@/types'

import { apiClient } from './client'
import { toCategory, type RawAmount } from './mappers'

interface RawReportSummary {
  biggestExpense: { category: string; amount: RawAmount } | null
  savingsProgress: { actual: RawAmount; planned: RawAmount; percentage: number }
  mostFrequentCategory: { category: string; count: number } | null
}

interface RawDistributionItem {
  category: string
  amount: RawAmount
  percentage: number
}

interface RawSavingsProjection {
  points: { date: string; cumulativeAmount: RawAmount }[]
  markers: { date: string; label: string }[]
}

function toReportSummary(raw: RawReportSummary): ReportSummary {
  const { biggestExpense, savingsProgress, mostFrequentCategory } = raw
  return {
    biggestExpense: biggestExpense && {
      category: toCategory(biggestExpense.category),
      amount: parseAmount(biggestExpense.amount),
    },
    savingsProgress: {
      actual: parseAmount(savingsProgress.actual),
      planned: parseAmount(savingsProgress.planned),
      percentage: savingsProgress.percentage,
    },
    mostFrequentCategory: mostFrequentCategory && {
      category: toCategory(mostFrequentCategory.category),
      count: mostFrequentCategory.count,
    },
  }
}

function toDistributionItem(raw: RawDistributionItem): DistributionItem {
  return {
    category: toCategory(raw.category),
    amount: parseAmount(raw.amount),
    percentage: raw.percentage,
  }
}

function toSavingsProjection(raw: RawSavingsProjection): SavingsProjection {
  return {
    points: raw.points.map(point => ({
      date: point.date,
      cumulativeAmount: parseAmount(point.cumulativeAmount),
    })),
    markers: raw.markers,
  }
}

export interface ReportsRepository {
  getSummary(periodId: string): Promise<ReportSummary>
  getDistribution(periodId: string): Promise<DistributionItem[]>
  getSavingsProjection(): Promise<SavingsProjection>
}

const httpReportsRepository: ReportsRepository = {
  async getSummary(periodId) {
    const { data } = await apiClient.get<RawReportSummary>('/reports/summary', {
      params: { periodId },
    })
    return toReportSummary(data)
  },
  async getDistribution(periodId) {
    const { data } = await apiClient.get<RawDistributionItem[]>('/reports/distribution', {
      params: { periodId },
    })
    return data.map(toDistributionItem)
  },
  async getSavingsProjection() {
    const { data } = await apiClient.get<RawSavingsProjection>('/reports/savings-projection')
    return toSavingsProjection(data)
  },
}

export const reportsRepository: ReportsRepository = httpReportsRepository
