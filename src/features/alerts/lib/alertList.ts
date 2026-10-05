import { parseRecurringAlertKey } from '@/lib/alertMessage'
import { toDateInputValue } from '@/lib/format'
import type { Alert, AlertType, RecurringExpense } from '@/types'
import { ALERT_TYPES } from '@/types'

export const PAGE_SIZE = 30

export interface AlertFilters {
  unreadOnly: boolean
  /** `null` = every type. */
  type: AlertType | null
}

export const NO_ALERT_FILTERS: AlertFilters = { unreadOnly: false, type: null }

export function isAlertType(value: string | null | undefined): value is AlertType {
  return value !== null && value !== undefined && (ALERT_TYPES as readonly string[]).includes(value)
}

/** `?unread=1&type=…` → filters; anything invalid falls back to the default. */
export function parseAlertFilters(params: URLSearchParams): AlertFilters {
  const type = params.get('type')
  return { unreadOnly: params.get('unread') === '1', type: isAlertType(type) ? type : null }
}

/** Read filter and type filter combine (AND). */
export function filterAlerts(alerts: readonly Alert[], filters: AlertFilters): Alert[] {
  return alerts.filter(
    alert =>
      (!filters.unreadOnly || !alert.read) &&
      (filters.type === null || alert.type === filters.type),
  )
}

export interface AlertCounts {
  all: number
  unread: number
  /** Per type, within the current read filter; only types with at least one alert. */
  byType: { type: string; count: number }[]
}

/**
 * "Todas" / "Sin leer" count every alert regardless of type; each type row counts what
 * that row would show combined with the current read filter.
 */
export function countAlerts(alerts: readonly Alert[], unreadOnly: boolean): AlertCounts {
  const byType = new Map<string, number>()
  for (const alert of alerts) {
    if (unreadOnly && alert.read) continue
    byType.set(alert.type, (byType.get(alert.type) ?? 0) + 1)
  }
  // Also list types that only have read alerts (count 0 under "Sin leer"), so the
  // filter rows don't jump around when switching.
  for (const alert of alerts) if (!byType.has(alert.type)) byType.set(alert.type, 0)
  return {
    all: alerts.length,
    unread: alerts.filter(alert => !alert.read).length,
    byType: [...byType.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type)),
  }
}

export interface AlertDay {
  /** `YYYY-MM-DD`, Bogotá. */
  dateKey: string
  alerts: Alert[]
}

/** Newest day first, newest alert first within a day (Bogotá days). */
export function groupAlertsByDay(alerts: readonly Alert[]): AlertDay[] {
  const sorted = [...alerts].sort((a, b) => b.sentAt.localeCompare(a.sentAt))
  const days = new Map<string, Alert[]>()
  for (const alert of sorted) {
    const dateKey = toDateInputValue(alert.sentAt)
    days.set(dateKey, [...(days.get(dateKey) ?? []), alert])
  }
  return [...days.entries()].map(([dateKey, items]) => ({ dateKey, alerts: items }))
}

/** The first `pages × PAGE_SIZE` alerts (client-side paging over what the API returned). */
export function paginate<T>(
  items: readonly T[],
  pages: number,
): { visible: T[]; hasMore: boolean } {
  const visible = items.slice(0, pages * PAGE_SIZE)
  return { visible, hasMore: visible.length < items.length }
}

export type RecurringAction =
  { kind: 'register'; expense: RecurringExpense } | { kind: 'registered' } | { kind: 'none' }

/**
 * "Registrar" for a RECURRING_EXPENSE_DUE alert, only when it's exact: the key must be
 * `[period:expense]`, the period must be the current one, and the expense must be in
 * the current period's pending list. Same alert but no longer pending → "Ya registrado".
 * Anything else (legacy key, older period, unknown expense) → no action. Never by name.
 */
export function resolveRecurringAction(
  alert: Pick<Alert, 'type' | 'message'>,
  currentPeriodId: string | undefined,
  pending: readonly RecurringExpense[] | undefined,
  all: readonly RecurringExpense[] | undefined,
): RecurringAction {
  if (alert.type !== 'RECURRING_EXPENSE_DUE' || !currentPeriodId || !pending || !all) {
    return { kind: 'none' }
  }
  const key = parseRecurringAlertKey(alert.message)
  if (!key || key.periodId !== currentPeriodId) return { kind: 'none' }
  const expense = pending.find(item => item.id === key.recurringExpenseId)
  if (expense) return { kind: 'register', expense }
  return all.some(item => item.id === key.recurringExpenseId)
    ? { kind: 'registered' }
    : { kind: 'none' }
}

/**
 * Whether `sentAt` carries a real time of day. Alerts are created at the moment their
 * check runs (e.g. the 8am reminder job), so they do — but a value at exactly 00:00:00.000
 * Bogotá would be a date stored without time, and showing "12:00 a. m." would mislead.
 */
export function hasMeaningfulTime(iso: string): boolean {
  const date = new Date(iso)
  return !(
    date.getUTCHours() === 5 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}
