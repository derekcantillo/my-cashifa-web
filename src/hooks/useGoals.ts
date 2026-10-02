import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { goalsRepository } from '@/api/goals'
import { queryKeys } from '@/lib/queryKeys'
import type { CreateGoalContributionInput, CreateGoalInput, Goal, UpdateGoalInput } from '@/types'

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

// Goals feed net worth (`goalsSavings`), the savings projection report and the
// SAVINGS_TARGET_AT_RISK alert. Refetches aren't awaited: modals close as soon as the
// write succeeds and screens refresh in the background.
const goalKeys = [
  queryKeys.goals.all,
  queryKeys.reports.all,
  queryKeys.netWorth,
  queryKeys.alerts.all,
]

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGoalInput) => goalsRepository.create(input),
    onSuccess: () => {
      void invalidateQueries(queryClient, ...goalKeys)
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGoalInput }) =>
      goalsRepository.update(id, input),
    onSuccess: goal => {
      replaceCachedGoal(queryClient, goal)
      void invalidateQueries(queryClient, ...goalKeys)
    },
  })
}

/**
 * Deleting a goal removes its contributions, so the backend recalculates the ledger.
 * Only the list is invalidated (exact key): the deleted goal's detail query is left
 * alone so the page still showing it doesn't refetch a 404 before navigating away.
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsRepository.remove(id),
    onSuccess: (_, id) => {
      // Drop it from the cached list right away (the screen selects another goal).
      queryClient.setQueryData<Goal[]>(queryKeys.goals.all, goals =>
        goals?.filter(goal => goal.id !== id),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.goals.all, exact: true })
      void invalidateFinancialState(queryClient)
    },
  })
}

/**
 * Contributions aren't transactions, but they count as savings in the period ledger of
 * their date (lowering `availableToSpend`) and the backend recalculates budgets and
 * alerts from that period on — so the full financial cascade applies. The response (the
 * updated goal, maybe now COMPLETED) goes into the cache at once.
 */
export function useCreateGoalContribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateGoalContributionInput }) =>
      goalsRepository.addContribution(id, input),
    onSuccess: goal => {
      replaceCachedGoal(queryClient, goal)
      void invalidateQueries(queryClient, queryKeys.goals.all)
      void invalidateFinancialState(queryClient)
    },
  })
}

/** Puts a goal returned by a write into the list and detail caches. */
function replaceCachedGoal(queryClient: QueryClient, goal: Goal): void {
  queryClient.setQueryData<Goal[]>(queryKeys.goals.all, goals =>
    goals?.map(item => (item.id === goal.id ? goal : item)),
  )
  queryClient.setQueryData(queryKeys.goals.detail(goal.id), goal)
}
