import { Plus, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  SectionError,
  Skeleton,
} from '@/components/ui'
import { useFormatters, useGoals } from '@/hooks'
import { cn } from '@/lib/cn'
import { formatDate, formatPercent } from '@/lib/format'
import { displayPercent, progressPercent } from '@/lib/goalMath'
import { goalPath, ROUTES } from '@/lib/routes'
import { useGoalModalStore } from '@/store/goalModalStore'
import type { Goal } from '@/types'

import { SectionLink } from './SectionLink'

const MAX_GOALS = 3

/** Active goals with the closest target date first. */
function nextGoals(goals: readonly Goal[]): Goal[] {
  return goals
    .filter(goal => goal.status === 'ACTIVE')
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
    .slice(0, MAX_GOALS)
}

export function GoalsCard({ className }: { className?: string }) {
  const { t } = useTranslation('home')
  const { data, isPending, isError, refetch } = useGoals()
  const openGoalModal = useGoalModalStore(state => state.open)
  const goals = nextGoals(data ?? [])

  return (
    <Card as="section" aria-labelledby="goals-title" className={cn('flex flex-col', className)}>
      <CardHeader
        title={t('goals.title')}
        titleId="goals-title"
        action={
          goals.length > 0 && <SectionLink to={ROUTES.goals}>{t('goals.seeAll')}</SectionLink>
        }
      />

      {isError ? (
        <SectionError onRetry={() => void refetch()} className="mt-6" />
      ) : isPending ? (
        <ul aria-busy className="mt-4 divide-y divide-line">
          {Array.from({ length: MAX_GOALS }, (_, index) => (
            <li key={index} className="space-y-2.5 py-4">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-48" />
            </li>
          ))}
        </ul>
      ) : goals.length === 0 ? (
        <EmptyState
          size="sm"
          icon={Target}
          title={t('goals.emptyTitle')}
          description={t('goals.emptyBody')}
          action={
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => openGoalModal('create')}
            >
              {t('goals.create')}
            </Button>
          }
          className="my-auto"
        />
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {goals.map(goal => (
            <li key={goal.id}>
              <GoalRow goal={goal} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function GoalRow({ goal }: { goal: Goal }) {
  const { t } = useTranslation('home')
  const { locale, money } = useFormatters()
  // Same helpers as the goals screen: clamped bar, label rounded down.
  const percentage = progressPercent(goal.currentAmount, goal.targetAmount)

  return (
    <Link
      to={goalPath(goal.id)}
      className="-mx-3 block space-y-2.5 rounded-md px-3 py-4 transition-tactile hover:bg-surface-sunken/70"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-body font-medium text-ink">{goal.name}</span>
        <span className="shrink-0 text-body-sm font-medium text-ink tabular-nums">
          {formatPercent(displayPercent(goal.currentAmount, goal.targetAmount) / 100, { locale })}
        </span>
      </div>
      <ProgressBar value={percentage} label={goal.name} />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-body-sm text-ink-muted tabular-nums">
        <span>
          {t('goals.saved', { saved: money(goal.currentAmount), target: money(goal.targetAmount) })}
        </span>
        <span>
          {t('goals.targetDate', {
            date: formatDate(goal.targetDate, {
              locale,
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
          })}
        </span>
      </div>
    </Link>
  )
}
