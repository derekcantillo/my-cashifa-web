import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { recurringExpensesRepository } from '@/api/recurringExpenses'
import { queryKeys } from '@/lib/queryKeys'
import type { CreateRecurringExpenseInput, UpdateRecurringExpenseInput } from '@/types'

import { invalidateQueries } from './invalidation'
import { skipUnless } from './skipUnless'

export function useRecurringExpenses() {
  return useQuery({
    queryKey: queryKeys.recurringExpenses.all,
    queryFn: () => recurringExpensesRepository.list(),
  })
}

export function usePendingRecurringExpenses(periodId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recurringExpenses.pending(periodId),
    queryFn: skipUnless(periodId, id => recurringExpensesRepository.getPending(id)),
  })
}

// Active recurring expenses set their category's budget limit, so every write makes
// the backend recalculate the current period's budgets (and possibly create alerts).
const affectedKeys = [queryKeys.recurringExpenses.all, queryKeys.budgets.all, queryKeys.alerts.all]

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRecurringExpenseInput) => recurringExpensesRepository.create(input),
    onSuccess: () => invalidateQueries(queryClient, ...affectedKeys),
  })
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRecurringExpenseInput }) =>
      recurringExpensesRepository.update(id, input),
    onSuccess: () => invalidateQueries(queryClient, ...affectedKeys),
  })
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recurringExpensesRepository.remove(id),
    onSuccess: () => invalidateQueries(queryClient, ...affectedKeys),
  })
}
