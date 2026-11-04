import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { institutionsRepository } from '@/api/institutions'
import { queryKeys } from '@/lib/queryKeys'

import { invalidateAccountState, invalidateQueries } from './invalidation'

export function useInstitutions() {
  return useQuery({
    queryKey: queryKeys.institutions.all,
    queryFn: () => institutionsRepository.list(),
  })
}

export function useCreateInstitution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => institutionsRepository.create(name),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.institutions.all),
  })
}

/** Accounts embed the institution's name, so they refresh too. */
export function useRenameInstitution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      institutionsRepository.rename(id, name),
    onSuccess: () => invalidateAccountState(queryClient),
  })
}

export function useDeleteInstitution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => institutionsRepository.remove(id),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.institutions.all),
  })
}
