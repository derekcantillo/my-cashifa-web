import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { budgetsRepository } from '@/api/budgets'
import { queryKeys } from '@/lib/queryKeys'
import type { BudgetLimitInput } from '@/types'

import { invalidateQueries } from './invalidation'
import { skipUnless } from './skipUnless'

export function useBudgets(periodId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.budgets.byPeriod(periodId),
    queryFn: skipUnless(periodId, id => budgetsRepository.getByPeriod(id)),
  })
}

// Budget writes re-run the backend's budget checks, which may create alerts.

export function useSetBudgets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ periodId, items }: { periodId: string; items: BudgetLimitInput[] }) =>
      budgetsRepository.setByPeriod(periodId, items),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.budgets.all, queryKeys.alerts.all),
  })
}

export function useRecalculateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => budgetsRepository.recalculate(periodId),
    onSuccess: () =>
      invalidateQueries(
        queryClient,
        queryKeys.budgets.all,
        queryKeys.periodLedger.all,
        queryKeys.alerts.all,
      ),
  })
}

export function useResetBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => budgetsRepository.reset(periodId),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.budgets.all, queryKeys.alerts.all),
  })
}
