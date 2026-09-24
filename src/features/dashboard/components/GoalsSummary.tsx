import { useTranslation } from 'react-i18next'

import { ProgressBar, progressPercentage } from '@/components/ui'
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
          const percentage = Math.round(progressPercentage(goal.currentAmount, goal.targetAmount))
          return (
            <li key={goal.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{goal.name}</span>
                <span className="shrink-0 text-ink-muted tabular-nums">
                  {t('goals.progress', { percentage })}
                </span>
              </div>
              <ProgressBar value={percentage} label={goal.name} />
            </li>
          )
        })}
      </ul>
      <SectionLink to={ROUTES.goals}>{t('goals.seeAll')}</SectionLink>
    </section>
  )
}
