import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { ProgressBar, progressPercentage } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { goalPath } from '@/lib/routes'
import type { Goal } from '@/types'

export function GoalCard({ goal }: { goal: Goal }) {
  const { t } = useTranslation('goals')
  const { money, shortDate } = useFormatters()

  return (
    <Link
      to={goalPath(goal.id)}
      className="block space-y-4 rounded-2xl border border-border bg-surface-elevated p-5 transition-colors hover:border-ink/20"
    >
      <p className="truncate font-semibold">{goal.name}</p>
      <div className="space-y-2">
        <ProgressBar
          value={progressPercentage(goal.currentAmount, goal.targetAmount)}
          label={goal.name}
        />
        <p className="text-sm tabular-nums">
          {t('progressLine', {
            current: money(goal.currentAmount),
            target: money(goal.targetAmount),
          })}
        </p>
      </div>
      <p className="text-xs text-ink-muted">
        {goal.status === 'PAUSED' ? `${t('paused')} · ` : ''}
        {t('by', { date: shortDate(goal.targetDate) })}
      </p>
    </Link>
  )
}
