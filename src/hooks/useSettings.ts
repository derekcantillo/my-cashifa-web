import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { settingsRepository } from '@/api/settings'
import { queryKeys } from '@/lib/queryKeys'
import type { Settings } from '@/types'

import { invalidateQueries } from './invalidation'

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsRepository.get(),
  })
}

/** The savings target feeds the reports' `savingsProgress.planned`. */
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Settings) => settingsRepository.update(input),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.settings, queryKeys.reports.all),
  })
}
