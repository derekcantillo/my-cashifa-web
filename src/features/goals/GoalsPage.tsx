import { ChevronRight, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { InlineError, Skeleton } from '@/components/ui'
import { useFormatters, useGoals } from '@/hooks'
import { goalPath } from '@/lib/routes'
import { useGoalModalStore } from '@/store/goalModalStore'

import { GoalCard } from './components/GoalCard'

export function GoalsPage() {
  const { t } = useTranslation('goals')
  const { money } = useFormatters()
  const { data, isPending, isError, refetch } = useGoals()
  const openModal = useGoalModalStore(state => state.open)

  // Paused goals stay with the active ones (still in progress); only completed ones fold away.
  const inProgress = (data ?? []).filter(goal => goal.status !== 'COMPLETED')
  const completed = (data ?? []).filter(goal => goal.status === 'COMPLETED')

  const newGoalButton = (
    <button
      type="button"
      onClick={() => openModal('create')}
      className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
    >
      <Plus className="size-4" aria-hidden />
      {t('new')}
    </button>
  )

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        {(data?.length ?? 0) > 0 && newGoalButton}
      </header>

      {isError ? (
        <InlineError onRetry={() => void refetch()} />
      ) : isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-4 rounded-2xl border border-border p-5">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="space-y-4 py-6">
          <p className="text-ink-muted">{t('empty')}</p>
          {newGoalButton}
        </div>
      ) : (
        <>
          {inProgress.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {inProgress.map(goal => (
                <li key={goal.id}>
                  <GoalCard goal={goal} />
                </li>
              ))}
            </ul>
          )}

          {completed.length > 0 && (
            <details className="group">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  className="size-4 transition-transform group-open:rotate-90"
                  aria-hidden
                />
                {t('showCompleted', { count: completed.length })}
              </summary>
              <ul className="mt-3 divide-y divide-border">
                {completed.map(goal => (
                  <li key={goal.id}>
                    <Link
                      to={goalPath(goal.id)}
                      className="flex items-center justify-between gap-4 py-3 text-sm hover:text-brand"
                    >
                      <span className="truncate">{goal.name}</span>
                      <span className="shrink-0 text-ink-muted tabular-nums">
                        {money(goal.targetAmount)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  )
}
