import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { accountsRepository } from '@/api/accounts'
import { queryKeys } from '@/lib/queryKeys'
import type {
  CreateAccountInput,
  SetInitialBalanceInput,
  StatementBalanceInput,
  UpdateAccountInput,
} from '@/types'

import { invalidateAccountState, invalidateQueries } from './invalidation'

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
    onSuccess: () =>
      invalidateQueries(
        queryClient,
        queryKeys.accounts.all,
        queryKeys.institutions.all,
        queryKeys.netWorth,
      ),
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAccountInput }) =>
      accountsRepository.update(id, input),
    onSuccess: () => invalidateAccountState(queryClient),
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

/** "Ajustar al extracto" / "Ajustar al saldo del banco". */
export function useAnchorToStatement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StatementBalanceInput }) =>
      accountsRepository.anchorToStatement(id, input),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.accounts.all, queryKeys.netWorth),
  })
}

export function useBalanceAdjustments(accountId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.accounts.adjustments(accountId),
    queryFn: () => accountsRepository.listAdjustments(accountId!),
    enabled: Boolean(accountId),
  })
}

export function useRevertAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, adjustmentId }: { id: string; adjustmentId: string }) =>
      accountsRepository.revertAdjustment(id, adjustmentId),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.accounts.all, queryKeys.netWorth),
  })
}
