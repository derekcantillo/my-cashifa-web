import { describe, expect, it, vi } from 'vitest'

import type { Alert, RecurringExpense } from '@/types'

import {
  countAlerts,
  hasMeaningfulTime,
  filterAlerts,
  groupAlertsByDay,
  paginate,
  parseAlertFilters,
  resolveRecurringAction,
} from './alertList'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

const PERIOD = 'cmuo5t68d010do701243733aj'
const OLD_PERIOD = 'cmu7knksn0003r9lqh267j75t'
const GAS = 'cmu74iq1h002dph01fhie6k5q'
const RENT = 'cmu746wnl000bph014egi6gqc'

const alert = (patch: Partial<Alert> & Pick<Alert, 'id'>): Alert => ({
  type: 'RECURRING_EXPENSE_DUE',
  message: 'x',
  read: false,
  sentAt: '2026-10-01T12:00:00.000Z',
  ...patch,
})

const expense = (id: string): RecurringExpense => ({
  id,
  name: id,
  category: 'SERVICES',
  estimatedAmount: 20000,
  isAmountFixed: false,
  dayOfMonth: 20,
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

describe('filters', () => {
  const alerts = [
    alert({ id: 'a', read: false }),
    alert({ id: 'b', read: true }),
    alert({ id: 'c', type: 'SAVINGS_TARGET_AT_RISK', read: false }),
    alert({ id: 'd', type: 'SAVINGS_TARGET_AT_RISK', read: true }),
  ]

  it('combines the read filter and the type filter', () => {
    const ids = (f: Parameters<typeof filterAlerts>[1]) => filterAlerts(alerts, f).map(a => a.id)
    expect(ids({ unreadOnly: false, type: null })).toEqual(['a', 'b', 'c', 'd'])
    expect(ids({ unreadOnly: true, type: null })).toEqual(['a', 'c'])
    expect(ids({ unreadOnly: false, type: 'SAVINGS_TARGET_AT_RISK' })).toEqual(['c', 'd'])
    expect(ids({ unreadOnly: true, type: 'SAVINGS_TARGET_AT_RISK' })).toEqual(['c'])
  })

  it('reads the URL and falls back on invalid values', () => {
    expect(parseAlertFilters(new URLSearchParams('unread=1&type=PERIOD_DEFICIT'))).toEqual({
      unreadOnly: true,
      type: 'PERIOD_DEFICIT',
    })
    expect(parseAlertFilters(new URLSearchParams('unread=yes&type=NOPE'))).toEqual({
      unreadOnly: false,
      type: null,
    })
  })

  it('counts all/unread and per type within the read filter', () => {
    expect(countAlerts(alerts, false)).toEqual({
      all: 4,
      unread: 2,
      byType: [
        { type: 'RECURRING_EXPENSE_DUE', count: 2 },
        { type: 'SAVINGS_TARGET_AT_RISK', count: 2 },
      ],
    })
    expect(countAlerts(alerts, true).byType.map(t => t.count)).toEqual([1, 1])
  })
})

describe('day groups (Bogotá)', () => {
  it('groups by Bogotá day, newest first', () => {
    const days = groupAlertsByDay([
      alert({ id: 'late', sentAt: '2026-10-02T03:30:00.000Z' }), // Oct 1, 22:30 Bogotá
      alert({ id: 'morning', sentAt: '2026-10-01T13:00:00.000Z' }),
      alert({ id: 'next', sentAt: '2026-10-02T13:00:00.000Z' }),
    ])
    expect(days.map(d => [d.dateKey, d.alerts.map(a => a.id)])).toEqual([
      ['2026-10-02', ['next']],
      ['2026-10-01', ['late', 'morning']],
    ])
  })
})

describe('client-side paging', () => {
  it('shows 30 per page', () => {
    const items = Array.from({ length: 65 }, (_, i) => i)
    expect(paginate(items, 1)).toMatchObject({ hasMore: true })
    expect(paginate(items, 1).visible).toHaveLength(30)
    expect(paginate(items, 3)).toEqual({ visible: items, hasMore: false })
  })
})

describe('"Registrar" on a recurring-expense alert', () => {
  const message = `[${PERIOD}:${GAS}] Gas: pago estimado`
  const all = [expense(GAS), expense(RENT)]

  it('registers only when the key is exact, current and still pending', () => {
    const result = resolveRecurringAction(
      { type: 'RECURRING_EXPENSE_DUE', message },
      PERIOD,
      [expense(GAS)],
      all,
    )
    expect(result).toEqual({ kind: 'register', expense: expense(GAS) })
  })

  it('says "already registered" when it is no longer pending', () => {
    expect(
      resolveRecurringAction(
        { type: 'RECURRING_EXPENSE_DUE', message },
        PERIOD,
        [expense(RENT)],
        all,
      ),
    ).toEqual({
      kind: 'registered',
    })
  })

  it('offers nothing for older periods, legacy keys or unknown expenses', () => {
    const none = { kind: 'none' }
    expect(
      resolveRecurringAction(
        { type: 'RECURRING_EXPENSE_DUE', message: `[${OLD_PERIOD}:${GAS}] Gas` },
        PERIOD,
        [expense(GAS)],
        all,
      ),
    ).toEqual(none)
    expect(
      resolveRecurringAction(
        { type: 'RECURRING_EXPENSE_DUE', message: `[2026-09:${GAS}] Gas` },
        PERIOD,
        [expense(GAS)],
        all,
      ),
    ).toEqual(none)
    expect(
      resolveRecurringAction(
        { type: 'RECURRING_EXPENSE_DUE', message: `[${PERIOD}:cmuzzzzzzzzzzzzzzzzzzzzzz] Gas` },
        PERIOD,
        [expense(GAS)],
        all,
      ),
    ).toEqual(none)
    expect(
      resolveRecurringAction(
        { type: 'SAVINGS_TARGET_AT_RISK', message },
        PERIOD,
        [expense(GAS)],
        all,
      ),
    ).toEqual(none)
  })
})

describe('time of an alert', () => {
  it('is meaningful unless it is exactly Bogotá midnight', () => {
    expect(hasMeaningfulTime('2026-10-01T12:24:09.120Z')).toBe(true)
    expect(hasMeaningfulTime('2026-10-01T05:00:00.000Z')).toBe(false)
    expect(hasMeaningfulTime('2026-10-01T05:00:00.001Z')).toBe(true)
  })
})
