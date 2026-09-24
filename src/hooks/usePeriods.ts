import { useQuery } from '@tanstack/react-query'

import { periodLedgerRepository } from '@/api/periodLedger'
import { periodsRepository } from '@/api/periods'
import { queryKeys } from '@/lib/queryKeys'

import { skipUnless } from './skipUnless'

const ONE_HOUR = 60 * 60 * 1000

export function usePeriods() {
  return useQuery({
    queryKey: queryKeys.periods.all,
    queryFn: () => periodsRepository.list(),
    staleTime: ONE_HOUR,
  })
}

export function useCurrentPeriod() {
  return useQuery({
    queryKey: queryKeys.periods.current,
    queryFn: () => periodsRepository.getCurrent(),
    staleTime: ONE_HOUR,
  })
}

/** Opening/closing balance, income, expenses and savings of a period. */
export function usePeriodLedger(periodId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.periodLedger.byPeriod(periodId),
    queryFn: skipUnless(periodId, id => periodLedgerRepository.getByPeriod(id)),
  })
}
