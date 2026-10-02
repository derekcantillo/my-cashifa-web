import { ArrowLeft, Plus, Target } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import {
  Button,
  Card,
  EmptyState,
  Enter,
  PageHeader,
  SectionError,
  Skeleton,
} from '@/components/ui'
import { DESKTOP_QUERY, useGoals, useMediaQuery } from '@/hooks'
import { cn } from '@/lib/cn'
import { GOAL_PARAM, goalPath } from '@/lib/routes'
import { useGoalModalStore } from '@/store/goalModalStore'
import type { Goal } from '@/types'

import { GoalDetailPanel } from './components/GoalDetailPanel'
import { GoalList } from './components/GoalList'
import { GoalsHero } from './components/GoalsHero'
import { defaultGoal, groupGoals } from './lib/goalView'

interface ListNavigationState {
  /** The detail was opened from the list on this screen (so ← can go back in history). */
  fromList?: boolean
}

/**
 * Goals: list + detail of the selected goal, which lives in `?goal=<id>` (reload and
 * Back keep it). From `lg` both sit side by side and the first active goal is the
 * default; below it the detail is its own view with "← Metas".
 */
export function GoalsPage() {
  const { t } = useTranslation('goals')
  const { data, isPending, isError, refetch } = useGoals()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const openModal = useGoalModalStore(state => state.open)

  const groups = useMemo(() => groupGoals(data ?? []), [data])
  const requested = data?.find(goal => goal.id === params.get(GOAL_PARAM))
  // A missing or unknown id falls back to the default without an error. Below `lg`
  // without an id only the list shows (the default detail stays hidden by CSS).
  const selected = requested ?? defaultGoal(groups)

  const select = (goal: Goal) => {
    if (goal.id === selected?.id && isDesktop) return
    navigate(goalPath(goal.id), { state: { fromList: true } satisfies ListNavigationState })
  }
  const backToList = () => {
    if ((location.state as ListNavigationState | null)?.fromList) navigate(-1)
    else setParams({}, { replace: true })
  }
  const clearSelection = () => setParams({}, { replace: true })

  const newGoalButton = (
    <Button variant="secondary" icon={Plus} onClick={() => openModal('create')}>
      {t('new')}
    </Button>
  )

  // One tree for every width: below `lg` the list and the detail are separate views,
  // swapped with CSS (`max-lg:hidden`), so resizing never unmounts the page.
  const listView = requested ? 'max-lg:hidden' : undefined
  const detailView = requested ? undefined : 'max-lg:hidden'

  return (
    <div className="space-y-8">
      {requested && (
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={backToList}
          className="-mb-3 -ml-3 lg:hidden"
        >
          {t('detail.back')}
        </Button>
      )}

      <Enter order={0} className={listView}>
        <PageHeader eyebrow={t('eyebrow')} title={t('title')} actions={newGoalButton} />
      </Enter>

      {isError ? (
        <SectionError onRetry={() => void refetch()} />
      ) : isPending ? (
        <GoalsSkeleton />
      ) : data.length === 0 ? (
        <Card variant="flat" padding="none">
          <EmptyState
            icon={Target}
            title={t('empty.title')}
            description={t('empty.body')}
            action={
              <Button icon={Plus} onClick={() => openModal('create')}>
                {t('empty.cta')}
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {groups.active.length > 0 && (
            <Enter order={1} className={listView}>
              <GoalsHero active={groups.active} />
            </Enter>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Enter order={2} className={cn('lg:col-span-5', listView)}>
              <GoalList
                inProgress={groups.inProgress}
                completed={groups.completed}
                // Highlighted only where list and detail sit side by side.
                selectedId={isDesktop ? selected?.id : undefined}
                onSelect={select}
              />
            </Enter>
            {selected && (
              <Enter order={3} className={cn('lg:col-span-7', detailView)}>
                {/* Stays in view under the topbar while the list scrolls. */}
                <div className="lg:sticky lg:top-20">
                  <GoalDetailPanel key={selected.id} goal={selected} onDeleted={clearSelection} />
                </div>
              </Enter>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function GoalsSkeleton() {
  return (
    <div aria-busy className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-11 w-64 sm:h-14 sm:w-80" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-1.5 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card padding="sm" className="space-y-1 lg:col-span-5">
          {[0, 1, 2].map(index => (
            <div key={index} className="space-y-2.5 px-3 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </Card>
        <Card padding="lg" className="hidden space-y-6 lg:col-span-7 lg:block">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-60 w-full" />
        </Card>
      </div>
    </div>
  )
}
