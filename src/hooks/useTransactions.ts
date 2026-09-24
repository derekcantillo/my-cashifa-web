import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { transactionsRepository } from '@/api/transactions'
import { queryKeys } from '@/lib/queryKeys'
import type { CreateTransactionInput, UpdateTransactionInput } from '@/types'

import { invalidateFinancialState } from './invalidation'
import { skipUnless } from './skipUnless'

export function useTransactions(periodId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.transactions.byPeriod(periodId),
    queryFn: skipUnless(periodId, id => transactionsRepository.listByPeriod(id)),
  })
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: skipUnless(id, transactionId => transactionsRepository.getById(transactionId)),
  })
}

// Every transaction write cascades on the backend (periods, ledger, budgets, alerts,
// balances, reports, net worth) — see invalidateFinancialState.

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => transactionsRepository.create(input),
    onSuccess: () => invalidateFinancialState(queryClient),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
      transactionsRepository.update(id, input),
    onSuccess: () => invalidateFinancialState(queryClient),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transactionsRepository.remove(id),
    onSuccess: () => invalidateFinancialState(queryClient),
  })
}
