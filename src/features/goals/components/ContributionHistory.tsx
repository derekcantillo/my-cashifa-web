import { PiggyBank } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, CardHeader, EmptyState } from '@/components/ui'
import { useFormatters } from '@/hooks'
import type { GoalContribution } from '@/types'

const VISIBLE = 8

/** Newest first; 8 at a time, the rest expand in place (the API already sends them all). */
export function ContributionHistory({
  contributions,
}: {
  contributions: readonly GoalContribution[]
}) {
  const { t } = useTranslation('goals')
  const { money, shortDate } = useFormatters()
  const [expanded, setExpanded] = useState(false)
  const sorted = [...contributions].sort((a, b) => b.contributedAt.localeCompare(a.contributedAt))
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE)

  return (
    <section aria-labelledby="contributions-title" className="space-y-2">
      <CardHeader
        titleId="contributions-title"
        title={sorted.length > 0 ? `${t('history.title')} (${sorted.length})` : t('history.title')}
      />
      {sorted.length === 0 ? (
        <EmptyState
          size="sm"
          icon={PiggyBank}
          title={t('history.emptyTitle')}
          description={t('history.emptyBody')}
        />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {visible.map(contribution => (
              <li key={contribution.id} className="flex min-h-14 items-center gap-4 py-2">
                <span className="w-24 shrink-0 text-body-sm text-ink-muted tabular-nums">
                  {shortDate(contribution.contributedAt)}
                </span>
                <span className="min-w-0 flex-1 truncate text-body text-ink">
                  {contribution.note}
                </span>
                <span className="shrink-0 text-body font-medium text-positive tabular-nums">
                  +{money(contribution.amount)}
                </span>
              </li>
            ))}
          </ul>
          {sorted.length > VISIBLE && (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={expanded}
              onClick={() => setExpanded(value => !value)}
              className="-ml-3"
            >
              {expanded ? t('history.showLess') : t('history.showAll', { count: sorted.length })}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
