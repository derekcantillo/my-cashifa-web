import { useTranslation } from 'react-i18next'

import { Card, Eyebrow } from '@/components/ui'
import { isKnownAlertType } from '@/lib/alertMeta'
import { cn } from '@/lib/cn'
import type { AlertType } from '@/types'

import type { AlertCounts, AlertFilters as Filters } from '../lib/alertList'

interface AlertFiltersProps {
  filters: Filters
  counts: AlertCounts
  onChange: (filters: Filters) => void
}

/**
 * From `lg`: a "Filtrar" card with one row per option. Below it: the same buttons as a
 * horizontal, scrollable row (no card). Toggle buttons with `aria-pressed`; the read
 * filter and the type filter combine.
 */
export function AlertFilters({ filters, counts, onChange }: AlertFiltersProps) {
  const { t } = useTranslation('alerts')

  const typeLabel = (type: string) =>
    isKnownAlertType(type) ? t(`types.${type}`) : t('types.UNKNOWN')

  return (
    <Card
      as="section"
      aria-label={t('filter.label')}
      padding="sm"
      className="max-lg:rounded-none max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none"
    >
      <Eyebrow as="h2" className="mb-2 px-3 max-lg:sr-only">
        {t('filter.title')}
      </Eyebrow>
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:p-0">
        <FilterRow
          label={t('filter.all')}
          count={counts.all}
          pressed={!filters.unreadOnly}
          onClick={() => onChange({ ...filters, unreadOnly: false })}
        />
        <FilterRow
          label={t('filter.unread')}
          count={counts.unread}
          pressed={filters.unreadOnly}
          onClick={() => onChange({ ...filters, unreadOnly: true })}
        />
        {counts.byType.length > 0 && (
          <>
            <span
              aria-hidden
              className="mx-1 w-px shrink-0 bg-line lg:mx-0 lg:my-2 lg:h-px lg:w-full"
            />
            <Eyebrow as="h3" className="px-3 pt-1 pb-1 max-lg:sr-only">
              {t('filter.types')}
            </Eyebrow>
            {counts.byType.map(({ type, count }) => (
              <FilterRow
                key={type}
                label={typeLabel(type)}
                count={count}
                pressed={filters.type === type}
                // Pressing the active type again clears it.
                onClick={() =>
                  onChange({
                    ...filters,
                    type: filters.type === type ? null : (type as AlertType),
                  })
                }
              />
            ))}
          </>
        )}
      </div>
    </Card>
  )
}

interface FilterRowProps {
  label: string
  count: number
  pressed: boolean
  onClick: () => void
}

/** Active: the selection style of the Metas list (sunken + 2px accent edge). */
function FilterRow({ label, count, pressed, onClick }: FilterRowProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'flex h-10 shrink-0 items-center gap-3 rounded-r-md border-l-2 px-3 text-left text-body transition-tactile',
        'max-lg:rounded-md max-lg:border-l-0 lg:w-full',
        pressed
          ? 'border-accent bg-surface-sunken font-medium text-ink'
          : 'border-transparent text-ink-muted hover:bg-surface-sunken/60 hover:text-ink',
      )}
    >
      <span className="truncate whitespace-nowrap lg:flex-1">{label}</span>
      <span className="text-body-sm text-ink-muted tabular-nums">{count}</span>
    </button>
  )
}
