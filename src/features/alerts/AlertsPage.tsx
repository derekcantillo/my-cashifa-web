import { CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InlineError, SegmentedControl, Skeleton, type SegmentedOption } from '@/components/ui'
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead, useUnreadAlertsCount } from '@/hooks'
import { useToastStore } from '@/store/toastStore'

import { AlertRow } from './components/AlertRow'

type Filter = 'all' | 'unread'

export function AlertsPage() {
  const { t } = useTranslation('alerts')
  const [filter, setFilter] = useState<Filter>('all')
  // Filtered on the backend (`?unreadOnly=true`), not client-side.
  const { data, isPending, isError, refetch } = useAlerts(filter === 'unread')
  const { data: unreadCount = 0 } = useUnreadAlertsCount()
  const markRead = useMarkAlertRead()
  const markAllRead = useMarkAllAlertsRead()
  const pushToast = useToastStore(state => state.push)

  // The backend already sends newest first; sorting keeps that true regardless.
  const alerts = [...(data ?? [])].sort((a, b) => b.sentAt.localeCompare(a.sentAt))

  const filterOptions: SegmentedOption<Filter>[] = [
    { value: 'all', label: t('all') },
    { value: 'unread', label: t('unread') },
  ]

  const onMarkAll = () =>
    markAllRead.mutate(undefined, {
      onSuccess: () => pushToast(t('markedAll')),
      onError: () => pushToast(t('markError'), 'error'),
    })

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAll}
            disabled={markAllRead.isPending}
            className="-mr-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10 disabled:opacity-60"
          >
            <CheckCheck className="size-4" aria-hidden />
            {t('markAll')}
          </button>
        )}
      </header>

      <div className="max-w-60">
        <SegmentedControl
          label={t('filter')}
          value={filter}
          options={filterOptions}
          onChange={setFilter}
        />
      </div>

      {isError ? (
        <InlineError onRetry={() => void refetch()} />
      ) : isPending ? (
        <ul className="divide-y divide-border" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="flex items-center gap-3 py-4">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-16" />
            </li>
          ))}
        </ul>
      ) : alerts.length === 0 ? (
        <p className="py-6 text-ink-muted">{filter === 'unread' ? t('emptyUnread') : t('empty')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {alerts.map(alert => (
            <li key={alert.id}>
              <AlertRow alert={alert} onMarkRead={id => markRead.mutate(id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
