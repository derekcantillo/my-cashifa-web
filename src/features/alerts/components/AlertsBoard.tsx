import { BellOff, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Card, EmptyState, Enter } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { dateKeyToDate, formatDate, previousDateKey, toDateInputValue } from '@/lib/format'
import type { Alert } from '@/types'

import {
  countAlerts,
  filterAlerts,
  groupAlertsByDay,
  NO_ALERT_FILTERS,
  paginate,
  type AlertFilters as Filters,
} from '../lib/alertList'
import { AlertFilters } from './AlertFilters'
import { AlertItem, type AlertAction } from './AlertItem'

interface AlertsBoardProps {
  alerts: readonly Alert[]
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  /** What each alert's contextual action does — decided by whoever owns the data. */
  actionFor: (alert: Alert) => AlertAction
  onMarkRead: (id: string) => void
}

/**
 * The alerts list with its filters: filter card (right from `lg`, a scrollable row
 * below), alerts grouped by Bogotá day, 30 at a time with "Ver más", and the empty
 * states. Pure presentation — the screen (or the design showcase) supplies the data
 * and the handlers.
 */
export function AlertsBoard({
  alerts,
  filters,
  onFiltersChange,
  actionFor,
  onMarkRead,
}: AlertsBoardProps) {
  const { t } = useTranslation('alerts')
  const { locale } = useFormatters()
  const [pages, setPages] = useState(1)

  const counts = countAlerts(alerts, filters.unreadOnly)
  const filtered = filterAlerts(alerts, filters)
  const { visible, hasMore } = paginate(filtered, pages)
  const days = groupAlertsByDay(visible)

  const setFilters = (next: Filters) => {
    setPages(1)
    onFiltersChange(next)
  }

  const today = toDateInputValue()
  const yesterday = previousDateKey(today)
  const thisYear = today.slice(0, 4)
  const dayLabel = (dateKey: string) =>
    dateKey === today
      ? t('list.today')
      : dateKey === yesterday
        ? t('list.yesterday')
        : formatDate(dateKeyToDate(dateKey), {
            locale,
            day: 'numeric',
            month: 'long',
            ...(dateKey.startsWith(thisYear) ? {} : { year: 'numeric' }),
          })

  if (alerts.length === 0) {
    return (
      <Card variant="flat" padding="none">
        <EmptyState icon={BellOff} title={t('empty.title')} description={t('empty.body')} />
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Enter order={1} className="min-w-0 lg:order-2 lg:col-span-4">
        <div className="lg:sticky lg:top-20">
          <AlertFilters filters={filters} counts={counts} onChange={setFilters} />
        </div>
      </Enter>
      <Enter order={2} className="min-w-0 lg:order-1 lg:col-span-8">
        <Card as="section" aria-label={t('list.label')} padding="md">
          {filtered.length === 0 ? (
            filters.unreadOnly && filters.type === null ? (
              <EmptyState
                size="sm"
                icon={CheckCheck}
                title={t('empty.allReadTitle')}
                description={t('empty.allReadBody')}
              />
            ) : (
              <EmptyState
                size="sm"
                icon={BellOff}
                title={t('empty.noResultsTitle')}
                description={t('empty.noResultsBody')}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFilters(NO_ALERT_FILTERS)}
                  >
                    {t('empty.clearFilters')}
                  </Button>
                }
              />
            )
          ) : (
            <>
              <div className="divide-y divide-line">
                {days.map((day, dayIndex) => (
                  // The day heading sits 16px under the previous day's last alert; its
                  // first alert brings its own 16px top padding.
                  <section
                    key={day.dateKey}
                    aria-labelledby={`alerts-${day.dateKey}`}
                    className="pt-4 first:pt-0"
                  >
                    <h2
                      id={`alerts-${day.dateKey}`}
                      className="text-body-sm font-semibold text-ink"
                    >
                      {dayLabel(day.dateKey)}
                    </h2>
                    <ul className="divide-y divide-line">
                      {day.alerts.map((alert, index) => (
                        <li key={alert.id}>
                          <AlertItem
                            alert={alert}
                            action={actionFor(alert)}
                            onMarkRead={onMarkRead}
                            // The card's padding closes the list: no extra space under it.
                            last={
                              !hasMore &&
                              dayIndex === days.length - 1 &&
                              index === day.alerts.length - 1
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              {hasMore && (
                <div className="border-t border-line pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPages(value => value + 1)}
                    className="-ml-3.5"
                  >
                    {t('list.showMore')}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </Enter>
    </div>
  )
}
