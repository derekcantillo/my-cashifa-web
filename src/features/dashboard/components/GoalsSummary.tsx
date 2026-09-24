import { useTranslation } from 'react-i18next'

import { useGoals } from '@/hooks'
import { ROUTES } from '@/lib/routes'

import { SectionLink } from './SectionLink'

const MAX_GOALS = 3

/** Secondary: renders nothing while loading, on error, or without active goals. */
export function GoalsSummary() {
  const { t } = useTranslation('dashboard')
  const { data } = useGoals()
  const goals = (data ?? []).filter(goal => goal.status === 'ACTIVE').slice(0, MAX_GOALS)

  if (goals.length === 0) return null

  return (
    <section aria-labelledby="goals-title" className="space-y-4">
      <h2 id="goals-title" className="font-semibold">
        {t('goals.title')}
      </h2>
      <ul className="space-y-4">
        {goals.map(goal => {
          const ratio = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0
          const percentage = Math.min(100, Math.round(ratio * 100))
          return (
            <li key={goal.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{goal.name}</span>
                <span className="shrink-0 text-ink-muted tabular-nums">
                  {t('goals.progress', { percentage })}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={goal.name}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}
                className="h-2 overflow-hidden rounded-full bg-ink/10"
              >
                <div className="h-full rounded-full bg-brand" style={{ width: `${percentage}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
      <SectionLink to={ROUTES.goals}>{t('goals.seeAll')}</SectionLink>
    </section>
  )
}
