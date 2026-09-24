import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { alertsRepository } from '@/api/alerts'
import { queryKeys } from '@/lib/queryKeys'

import { invalidateQueries } from './invalidation'

export function useAlerts(unreadOnly = false) {
  return useQuery({
    queryKey: queryKeys.alerts.list(unreadOnly),
    queryFn: () => alertsRepository.list(unreadOnly),
  })
}

export function useUnreadAlertsCount() {
  return useQuery({
    queryKey: queryKeys.alerts.unreadCount,
    queryFn: () => alertsRepository.getUnreadCount(),
    refetchInterval: 60_000,
  })
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => alertsRepository.markRead(id),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.alerts.all),
  })
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => alertsRepository.markAllRead(),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.alerts.all),
  })
}
