import { useQuery } from '@tanstack/react-query'

import { reportsRepository } from '@/api/reports'
import { queryKeys } from '@/lib/queryKeys'

import { skipUnless } from './skipUnless'

export function useReportSummary(periodId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reports.summary(periodId),
    queryFn: skipUnless(periodId, id => reportsRepository.getSummary(id)),
  })
}

export function useReportDistribution(periodId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reports.distribution(periodId),
    queryFn: skipUnless(periodId, id => reportsRepository.getDistribution(id)),
  })
}

export function useSavingsProjection() {
  return useQuery({
    queryKey: queryKeys.reports.savingsProjection,
    queryFn: () => reportsRepository.getSavingsProjection(),
  })
}
