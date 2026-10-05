import { CheckCheck } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button, Card, Enter, PageHeader, SectionError, Skeleton } from '@/components/ui'
import {
  useAlerts,
  useCurrentPeriod,
  useMarkAlertRead,
  useMarkAllAlertsRead,
  usePendingRecurringExpenses,
  useRecurringExpenses,
  useUnreadAlertsCount,
} from '@/hooks'
import { ROUTES } from '@/lib/routes'
import { useToastStore } from '@/store/toastStore'
import { useTransactionModalStore } from '@/store/transactionModalStore'
import type { Alert } from '@/types'

import { type AlertAction } from './components/AlertItem'
import { AlertsBoard } from './components/AlertsBoard'
import {
  parseAlertFilters,
  resolveRecurringAction,
  type AlertFilters as Filters,
} from './lib/alertList'

/**
 * Alerts are read-only here: mark one/all as read and jump to what they're about.
 * GET /alerts returns the latest 50 (no paging); filtering, grouping and the
 * 30-at-a-time "Ver más" are client-side. Filters live in the URL (`?unread=1&type=`).
 */
export function AlertsPage() {
  const { t } = useTranslation('alerts')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filters = parseAlertFilters(params)

  const { data, isPending, isError, refetch } = useAlerts(false)
  const { data: unreadCount } = useUnreadAlertsCount()
  const markRead = useMarkAlertRead()
  const markAllRead = useMarkAllAlertsRead()
  const pushToast = useToastStore(state => state.push)
  const openForRecurring = useTransactionModalStore(state => state.openForRecurring)
  // "Registrar" needs the current period's pending recurring expenses.
  const { data: currentPeriod } = useCurrentPeriod()
  const { data: pending } = usePendingRecurringExpenses(currentPeriod?.id)
  const { data: recurringExpenses } = useRecurringExpenses()

  const alerts = useMemo(() => data ?? [], [data])

  const setFilters = (next: Filters) => {
    const updated = new URLSearchParams(params)
    if (next.unreadOnly) updated.set('unread', '1')
    else updated.delete('unread')
    if (next.type) updated.set('type', next.type)
    else updated.delete('type')
    setParams(updated, { replace: true })
  }

  const markOne = (id: string) =>
    markRead.mutate(id, { onError: () => pushToast(t('markError'), 'error') })

  /** Marks it read first, then runs the action (the mobile app does the same). */
  const readThen = (alert: Alert, run: () => void) => () => {
    if (!alert.read) markOne(alert.id)
    run()
  }

  const actionFor = (alert: Alert): AlertAction => {
    switch (alert.type) {
      case 'RECURRING_EXPENSE_DUE': {
        const recurring = resolveRecurringAction(
          alert,
          currentPeriod?.id,
          pending,
          recurringExpenses,
        )
        if (recurring.kind === 'register') {
          return {
            kind: 'register',
            label: t('actions.register'),
            onRun: readThen(alert, () => openForRecurring(recurring.expense)),
          }
        }
        return recurring.kind === 'registered' ? { kind: 'registered' } : { kind: 'none' }
      }
      case 'SAVINGS_TARGET_AT_RISK':
      case 'GOAL_PROGRESS':
        return {
          kind: 'navigate',
          label: t('actions.goals'),
          onRun: readThen(alert, () => navigate(ROUTES.goals)),
        }
      case 'BUDGET_70':
      case 'BUDGET_90':
      case 'BUDGET_100':
        return {
          kind: 'navigate',
          label: t('actions.expenses'),
          onRun: readThen(alert, () => navigate(ROUTES.transactions)),
        }
      default:
        // PERIOD_DEFICIT and the rest: the mobile app has nowhere to go either.
        return { kind: 'none' }
    }
  }

  const unread = unreadCount ?? alerts.filter(alert => !alert.read).length
  const status = unread > 0 ? t('unreadCount', { count: unread }) : t('allRead')

  return (
    <div className="space-y-8">
      <Enter order={0}>
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={unreadCount === undefined && isPending ? ' ' : status}
          actions={
            <Button
              variant="secondary"
              icon={CheckCheck}
              disabled={unread === 0}
              loading={markAllRead.isPending}
              onClick={() =>
                markAllRead.mutate(undefined, {
                  onSuccess: () => pushToast(t('markedAll')),
                  onError: () => pushToast(t('markError'), 'error'),
                })
              }
            >
              {t('markAll')}
            </Button>
          }
        />
      </Enter>

      {isError ? (
        <SectionError onRetry={() => void refetch()} />
      ) : isPending ? (
        <AlertsSkeleton />
      ) : (
        <AlertsBoard
          alerts={alerts}
          filters={filters}
          onFiltersChange={setFilters}
          actionFor={actionFor}
          onMarkRead={markOne}
        />
      )}
    </div>
  )
}

function AlertsSkeleton() {
  return (
    <div aria-busy className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card padding="sm" className="space-y-2 lg:order-2 lg:col-span-4">
        {[0, 1, 2, 3].map(index => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </Card>
      <Card padding="md" className="space-y-5 lg:order-1 lg:col-span-8">
        <Skeleton className="h-3.5 w-16" />
        {[0, 1, 2].map(index => (
          <div key={index} className="flex gap-3">
            <Skeleton className="size-[18px] rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
