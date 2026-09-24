import { useTranslation } from 'react-i18next'

import { useFormatters } from '@/hooks'
import type { GoalContribution } from '@/types'

/** Light rows, newest first — also the accessible table view of the chart's data. */
export function ContributionList({ contributions }: { contributions: GoalContribution[] }) {
  const { t } = useTranslation('goals')
  const { money, shortDate } = useFormatters()
  const sorted = [...contributions].sort((a, b) => b.contributedAt.localeCompare(a.contributedAt))

  return (
    <section aria-labelledby="contributions-title" className="space-y-2">
      <h2 id="contributions-title" className="font-semibold">
        {t('history.title')}
      </h2>
      {sorted.length === 0 ? (
        <p className="py-4 text-ink-muted">{t('history.empty')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map(contribution => (
            <li key={contribution.id} className="flex items-baseline gap-4 py-3">
              <span className="w-24 shrink-0 text-sm text-ink-muted">
                {shortDate(contribution.contributedAt)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{contribution.note}</span>
              <span className="shrink-0 font-medium tabular-nums">
                +{money(contribution.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
