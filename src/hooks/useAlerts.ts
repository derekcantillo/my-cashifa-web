import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { alertsRepository } from '@/api/alerts'
import { queryKeys } from '@/lib/queryKeys'
import type { Alert } from '@/types'

import { invalidateQueries } from './invalidation'

export function useAlerts(unreadOnly = false) {
  return useQuery({
    queryKey: queryKeys.alerts.list(unreadOnly),
    queryFn: () => alertsRepository.list(unreadOnly),
  })
}

/** The one source of the unread count (sidebar badge, bell dot, Alertas header). */
export function useUnreadAlertsCount() {
  return useQuery({
    queryKey: queryKeys.alerts.unreadCount,
    queryFn: () => alertsRepository.getUnreadCount(),
    refetchInterval: 60_000,
  })
}

interface AlertsSnapshot {
  lists: [readonly unknown[], Alert[] | undefined][]
  count: number | undefined
}

/**
 * Optimistic read: every cached alert list and the unread count change at once (the
 * sidebar badge and the bell follow), and are restored if the request fails.
 */
async function applyRead(
  queryClient: QueryClient,
  isTarget: (alert: Alert) => boolean,
  fallbackDelta: (count: number) => number,
): Promise<AlertsSnapshot> {
  await queryClient.cancelQueries({ queryKey: queryKeys.alerts.all })
  const lists = queryClient.getQueriesData<Alert[]>({ queryKey: ['alerts', 'list'] })
  const count = queryClient.getQueryData<number>(queryKeys.alerts.unreadCount)
  // How many unread alerts this marks, from the unfiltered list before the change;
  // without it cached, assume what the action implies (one alert, or all of them).
  const unfiltered = lists.find(([key]) => key[2] === false)?.[1]
  const newlyRead = unfiltered
    ? unfiltered.filter(alert => isTarget(alert) && !alert.read).length
    : fallbackDelta(count ?? 0)
  for (const [key, alerts] of lists) {
    if (!alerts) continue
    queryClient.setQueryData<Alert[]>(
      key,
      alerts.map(alert => (isTarget(alert) && !alert.read ? { ...alert, read: true } : alert)),
    )
  }
  if (count !== undefined) {
    queryClient.setQueryData<number>(queryKeys.alerts.unreadCount, Math.max(0, count - newlyRead))
  }
  return { lists, count }
}

function restore(queryClient: QueryClient, snapshot: AlertsSnapshot | undefined): void {
  if (!snapshot) return
  for (const [key, alerts] of snapshot.lists) queryClient.setQueryData(key, alerts)
  queryClient.setQueryData(queryKeys.alerts.unreadCount, snapshot.count)
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => alertsRepository.markRead(id),
    onMutate: id =>
      applyRead(
        queryClient,
        alert => alert.id === id,
        () => 1,
      ),
    onError: (_error, _id, snapshot) => restore(queryClient, snapshot),
    onSettled: () => {
      void invalidateQueries(queryClient, queryKeys.alerts.all)
    },
  })
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => alertsRepository.markAllRead(),
    onMutate: () =>
      applyRead(
        queryClient,
        () => true,
        count => count,
      ),
    onError: (_error, _variables, snapshot) => restore(queryClient, snapshot),
    onSettled: () => {
      void invalidateQueries(queryClient, queryKeys.alerts.all)
    },
  })
}
