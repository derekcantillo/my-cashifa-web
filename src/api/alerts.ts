import type { Alert } from '@/types'

import { apiClient } from './client'

type RawAlert = Alert

export interface AlertsRepository {
  /** Newest first, at most 50. */
  list(unreadOnly?: boolean): Promise<Alert[]>
  getUnreadCount(): Promise<number>
  markRead(id: string): Promise<Alert>
  /** Returns how many alerts were marked. */
  markAllRead(): Promise<number>
}

const httpAlertsRepository: AlertsRepository = {
  async list(unreadOnly = false) {
    // Only send the flag when true: the backend's implicit conversion turns the
    // string "false" into `true`, so `?unreadOnly=false` would return unread only.
    const { data } = await apiClient.get<RawAlert[]>('/alerts', {
      params: unreadOnly ? { unreadOnly: true } : undefined,
    })
    return data
  },
  async getUnreadCount() {
    const { data } = await apiClient.get<{ count: number }>('/alerts/unread-count')
    return data.count
  },
  async markRead(id) {
    const { data } = await apiClient.patch<RawAlert>(`/alerts/${id}/read`)
    return data
  },
  async markAllRead() {
    const { data } = await apiClient.post<{ updated: number }>('/alerts/read-all')
    return data.updated
  },
}

export const alertsRepository: AlertsRepository = httpAlertsRepository
