import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Amount, Card, CardHeader, SectionError, Skeleton } from '@/components/ui'
import { goalPath, ROUTES } from '@/lib/routes'
import type { Goal, NetWorth } from '@/types'

import type { QueryState } from '../lib/queryState'
import { EmptyRow, linkRowClassName, SectionLink } from './sections'

interface GoalsSetAsideCardProps {
  netWorth: QueryState<NetWorth>
  goals: QueryState<Goal[]>
}

/**
 * Informative: goal money already sits in the accounts (a contribution moves nothing), so
 * it's shown as an earmark and never added to net worth. The total comes from
 * GET /net-worth (`info.goalsSavings`), the rows from the goals list.
 */
export function GoalsSetAsideCard({ netWorth, goals }: GoalsSetAsideCardProps) {
  const { t } = useTranslation('netWorth')
  const titleId = useId()
  const total = netWorth.data?.info.goalsSavings

  return (
    <Card as="section" aria-labelledby={titleId} padding="md">
      <CardHeader
        title={t('goals.title')}
        titleId={titleId}
        action={
          total !== undefined ? (
            <Amount value={total} className="text-body font-medium text-ink-muted" />
          ) : (
            netWorth.isPending && <Skeleton className="h-4 w-24" />
          )
        }
      />
      <p className="mt-3 text-body-sm text-ink-muted text-pretty">{t('goals.body')}</p>

      <div className="mt-2">
        {goals.isError ? (
          <SectionError onRetry={() => void goals.refetch()} className="my-2" />
        ) : goals.isPending || goals.data === undefined ? (
          <div aria-busy className="space-y-3 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : (
          <GoalRows goals={goals.data} />
        )}
      </div>

      {!goals.isError && (
        <div className="mt-2">
          <SectionLink to={ROUTES.goals}>{t('goals.see')}</SectionLink>
        </div>
      )}
    </Card>
  )
}

/** Goals holding money (any status: the backend sums every goal), biggest first. */
function GoalRows({ goals }: { goals: readonly Goal[] }) {
  const { t } = useTranslation('netWorth')
  const saving = goals
    .filter(goal => goal.currentAmount > 0)
    .sort((a, b) => b.currentAmount - a.currentAmount)

  if (saving.length === 0) return <EmptyRow>{t('goals.empty')}</EmptyRow>
  return (
    <ul>
      {saving.map(goal => (
        <li key={goal.id}>
          <Link to={goalPath(goal.id)} className={linkRowClassName}>
            <span className="min-w-0 flex-1 truncate text-body text-ink">{goal.name}</span>
            <Amount value={goal.currentAmount} className="text-body text-ink-muted" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
