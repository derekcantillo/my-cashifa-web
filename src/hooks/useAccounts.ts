import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { accountsRepository } from '@/api/accounts'
import { queryKeys } from '@/lib/queryKeys'
import type { CreateAccountInput, SetInitialBalanceInput } from '@/types'

import { invalidateQueries } from './invalidation'

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: () => accountsRepository.list(),
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountsRepository.create(input),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.accounts.all),
  })
}

export function useSetInitialBalance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetInitialBalanceInput }) =>
      accountsRepository.setInitialBalance(id, input),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.accounts.all, queryKeys.netWorth),
  })
}
