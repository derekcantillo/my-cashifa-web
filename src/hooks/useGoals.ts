import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { goalsRepository } from '@/api/goals'
import { queryKeys } from '@/lib/queryKeys'
import type { CreateGoalContributionInput, CreateGoalInput, UpdateGoalInput } from '@/types'

import { invalidateFinancialState, invalidateQueries } from './invalidation'
import { skipUnless } from './skipUnless'

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals.all,
    queryFn: () => goalsRepository.list(),
  })
}

export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: skipUnless(id, goalId => goalsRepository.getById(goalId)),
  })
}

// Goals feed net worth (`goalsSavings`) and the savings projection report.

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGoalInput) => goalsRepository.create(input),
    onSuccess: () =>
      invalidateQueries(
        queryClient,
        queryKeys.goals.all,
        queryKeys.reports.all,
        queryKeys.netWorth,
      ),
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGoalInput }) =>
      goalsRepository.update(id, input),
    onSuccess: () =>
      invalidateQueries(
        queryClient,
        queryKeys.goals.all,
        queryKeys.reports.all,
        queryKeys.netWorth,
      ),
  })
}

/** Deleting a goal removes its contributions, so the backend recalculates the ledger. */
export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsRepository.remove(id),
    onSuccess: () =>
      Promise.all([
        invalidateQueries(queryClient, queryKeys.goals.all),
        invalidateFinancialState(queryClient),
      ]),
  })
}

/** Contributions count as savings in the period ledger, so the full cascade applies. */
export function useCreateGoalContribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateGoalContributionInput }) =>
      goalsRepository.addContribution(id, input),
    onSuccess: () =>
      Promise.all([
        invalidateQueries(queryClient, queryKeys.goals.all),
        invalidateFinancialState(queryClient),
      ]),
  })
}
