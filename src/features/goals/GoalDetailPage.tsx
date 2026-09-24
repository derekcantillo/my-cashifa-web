import axios from 'axios'
import { ArrowLeft, CircleCheck, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { IconButton, InlineError, Skeleton } from '@/components/ui'
import { useFormatters, useGoal } from '@/hooks'
import { buildGoalProjection } from '@/lib/goalProjection'
import { ROUTES } from '@/lib/routes'
import { useGoalModalStore } from '@/store/goalModalStore'

import { ContributionForm } from './components/ContributionForm'
import { ContributionList } from './components/ContributionList'
import { DeleteGoalPopover } from './components/DeleteGoalPopover'
import { GoalProjectionChart } from './components/GoalProjectionChart'

export function GoalDetailPage() {
  const { t } = useTranslation('goals')
  const { money } = useFormatters()
  const { id } = useParams<{ id: string }>()
  const { data: goal, isPending, isError, error, refetch } = useGoal(id)
  const openModal = useGoalModalStore(state => state.open)
  const [contributing, setContributing] = useState(false)
  const projection = useMemo(() => (goal ? buildGoalProjection(goal) : null), [goal])

  const backLink = (
    <Link
      to={ROUTES.goals}
      className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {t('detail.back')}
    </Link>
  )

  if (isError) {
    const notFound = axios.isAxiosError(error) && error.response?.status === 404
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {backLink}
        {notFound ? (
          <p className="text-ink-muted">{t('detail.notFound')}</p>
        ) : (
          <InlineError onRetry={() => void refetch()} />
        )}
      </div>
    )
  }

  if (isPending || !projection) {
    return (
      <div className="mx-auto max-w-3xl space-y-8" aria-busy="true">
        {backLink}
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-14 w-72 max-w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const showChart = goal.contributions.length >= 2

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="space-y-4">
        {backLink}
        <header className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{goal.name}</h1>
          <div className="flex items-center gap-1">
            <IconButton
              label={t('detail.edit')}
              icon={Pencil}
              onClick={() => openModal('edit', goal.id)}
            />
            <DeleteGoalPopover goalId={goal.id} />
          </div>
        </header>
      </div>

      <section aria-labelledby="saved-label" className="space-y-3">
        <p id="saved-label" className="text-ink-muted">
          {t('detail.saved')}
        </p>
        <p className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
          {money(goal.currentAmount)}
        </p>
        <p className="text-ink-muted tabular-nums">
          {remaining > 0
            ? t('detail.summary', { target: money(goal.targetAmount), remaining: money(remaining) })
            : t('detail.reached', { target: money(goal.targetAmount) })}
        </p>

        <div className="pt-3">
          {goal.status === 'COMPLETED' ? (
            <p className="inline-flex items-center gap-2 font-medium">
              <CircleCheck className="size-5 text-success" aria-hidden />
              {t('detail.completed')}
            </p>
          ) : goal.status === 'ACTIVE' && !contributing ? (
            <button
              type="button"
              onClick={() => setContributing(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
            >
              <Plus className="size-4" aria-hidden />
              {t('detail.contribute')}
            </button>
          ) : null}
        </div>
        {contributing && goal.status === 'ACTIVE' && (
          <ContributionForm goalId={goal.id} onDone={() => setContributing(false)} />
        )}
      </section>

      {showChart && (
        <section aria-labelledby="chart-title" className="space-y-4">
          <h2 id="chart-title" className="font-semibold">
            {t('chart.title')}
          </h2>
          <GoalProjectionChart projection={projection} targetAmount={goal.targetAmount} />
        </section>
      )}

      <ContributionList contributions={goal.contributions} />
    </div>
  )
}
