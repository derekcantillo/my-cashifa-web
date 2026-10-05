import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertsBoard, type AlertAction } from '@/features/alerts'
import { NO_ALERT_FILTERS, type AlertFilters } from '@/features/alerts/lib/alertList'
import { addDaysToDateKey, toDateInputValue } from '@/lib/format'
import type { Alert, AlertType } from '@/types'

/** `daysAgo` days before today (Bogotá), at `time` Bogotá. */
function sentAt(daysAgo: number, time: string): string {
  const dateKey = addDaysToDateKey(toDateInputValue(), -daysAgo)
  return new Date(`${dateKey}T${time}:00-05:00`).toISOString()
}

// Messages come from the backend in Spanish, whatever the UI language.
const FIXED: Alert[] = [
  {
    id: 'mock-goal-risk',
    type: 'SAVINGS_TARGET_AT_RISK',
    message: 'Tus metas necesitan $ 7.333.334 al mes y este periodo llevas $ 2.100.000 ahorrados.',
    read: false,
    sentAt: sentAt(0, '14:55'),
  },
  {
    // Carries the backend's dedupe prefix: the list hides it.
    id: 'mock-recurring-pending',
    type: 'RECURRING_EXPENSE_DUE',
    message: '[cm9showcaseperiod00001:cm9showcaseexpense0001] Mañana vence Arriendo ($ 1.800.000).',
    read: false,
    sentAt: sentAt(0, '08:00'),
  },
  {
    id: 'mock-unknown',
    type: 'NEW_KIND_OF_ALERT',
    message: 'Un tipo de alerta que esta versión del web aún no conoce: se muestra como aviso.',
    read: false,
    sentAt: sentAt(0, '07:12'),
  },
  {
    id: 'mock-recurring-done',
    type: 'RECURRING_EXPENSE_DUE',
    message: '[cm9showcaseperiod00001:cm9showcaseexpense0002] Hoy vence Internet ($ 95.000).',
    read: true,
    sentAt: sentAt(1, '08:00'),
  },
  {
    id: 'mock-deficit',
    type: 'PERIOD_DEFICIT',
    message: 'Este periodo llevas $ 320.000 más en gastos que en ingresos.',
    read: false,
    sentAt: sentAt(1, '19:40'),
  },
  {
    id: 'mock-budget',
    type: 'BUDGET_90',
    message: 'Ya usaste el 90 % del presupuesto de Mercado.',
    read: true,
    sentAt: sentAt(1, '12:03'),
  },
]

const FILLER_TYPES: AlertType[] = [
  'BUDGET_70',
  'RECURRING_EXPENSE_DUE',
  'GOAL_PROGRESS',
  'LARGE_EXPENSE',
  'WEEKLY_SUMMARY',
  'BUDGET_100',
]

/** Enough read history (36 in total) for "Ver más" to show. */
const FILLER: Alert[] = Array.from({ length: 30 }, (_, index) => {
  const type = FILLER_TYPES[index % FILLER_TYPES.length]
  return {
    id: `mock-filler-${index}`,
    type,
    message: `Alerta de ejemplo ${index + 1} (${type}).`,
    read: true,
    sentAt: sentAt(
      2 + Math.floor(index / 3),
      `${String(9 + (index % 3) * 4).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}`,
    ),
  }
})

const MOCK_ALERTS = [...FIXED, ...FILLER]

interface AlertsShowcaseProps {
  initialFilters?: AlertFilters
}

/**
 * The real alerts board over mock data. Every action stays local: "Marcar como leída"
 * and the contextual actions flip `read` in this component's state, nothing is sent.
 */
export function AlertsShowcase({ initialFilters = NO_ALERT_FILTERS }: AlertsShowcaseProps) {
  const { t } = useTranslation('alerts')
  const [alerts, setAlerts] = useState(MOCK_ALERTS)
  const [filters, setFilters] = useState(initialFilters)

  const markRead = (id: string) =>
    setAlerts(current => current.map(alert => (alert.id === id ? { ...alert, read: true } : alert)))

  const actionFor = (alert: Alert): AlertAction => {
    const run = () => markRead(alert.id)
    switch (alert.type) {
      case 'RECURRING_EXPENSE_DUE':
        // Only the one whose expense is "still pending" can be registered.
        return alert.id === 'mock-recurring-pending'
          ? { kind: 'register', label: t('actions.register'), onRun: run }
          : { kind: 'registered' }
      case 'SAVINGS_TARGET_AT_RISK':
      case 'GOAL_PROGRESS':
        return { kind: 'navigate', label: t('actions.goals'), onRun: run }
      case 'BUDGET_70':
      case 'BUDGET_90':
      case 'BUDGET_100':
        return { kind: 'navigate', label: t('actions.expenses'), onRun: run }
      default:
        return { kind: 'none' }
    }
  }

  return (
    <AlertsBoard
      alerts={alerts}
      filters={filters}
      onFiltersChange={setFilters}
      actionFor={actionFor}
      onMarkRead={markRead}
    />
  )
}
