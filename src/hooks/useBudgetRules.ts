import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { budgetRulesRepository } from '@/api/budgetRules'
import { queryKeys } from '@/lib/queryKeys'
import type { BudgetRule } from '@/types'

import { invalidateQueries } from './invalidation'

export function useBudgetRules() {
  return useQuery({
    queryKey: queryKeys.budgetRules.all,
    queryFn: () => budgetRulesRepository.get(),
  })
}

/**
 * Only saves the rules — the backend does not re-derive budget limits here.
 * Follow up with `useRecalculateBudget` to apply them to a period.
 */
export function useUpdateBudgetRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rules: BudgetRule[]) => budgetRulesRepository.update(rules),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.budgetRules.all),
  })
}
