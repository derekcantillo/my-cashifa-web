import { Plus, Target } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { MasterDetailLayout } from '@/components/layout'
import { Button, Card, EmptyState, PageHeader, SectionError, Skeleton } from '@/components/ui'
import { useGoals, useMasterDetail } from '@/hooks'
import { GOAL_PARAM, goalPath } from '@/lib/routes'
import { useGoalModalStore } from '@/store/goalModalStore'

import { GoalDetailPanel } from './components/GoalDetailPanel'
import { GoalList } from './components/GoalList'
import { GoalsHero } from './components/GoalsHero'
import { defaultGoal, groupGoals } from './lib/goalView'

/**
 * Goals: list + detail of the selected goal, which lives in `?goal=<id>` (reload and
 * Back keep it). From `lg` both sit side by side and the first active goal is the
 * default; below it the detail is its own view with "← Metas".
 */
export function GoalsPage() {
  const { t } = useTranslation('goals')
  const { data, isPending, isError, refetch } = useGoals()
  const openModal = useGoalModalStore(state => state.open)
  const groups = useMemo(() => groupGoals(data ?? []), [data])
  const { requested, selected, isDesktop, select, backToList, clearSelection } = useMasterDetail({
    items: data,
    param: GOAL_PARAM,
    defaultItem: defaultGoal(groups),
    pathFor: goalPath,
  })

  return (
    <MasterDetailLayout
      detailOpen={Boolean(requested)}
      backLabel={t('detail.back')}
      onBack={backToList}
      header={
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          actions={
            <Button variant="secondary" icon={Plus} onClick={() => openModal('create')}>
              {t('new')}
            </Button>
          }
        />
      }
      body={
        isError ? (
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
        ) : undefined
      }
      hero={groups.active.length > 0 && <GoalsHero active={groups.active} />}
      list={
        <GoalList
          inProgress={groups.inProgress}
          completed={groups.completed}
          // Highlighted only where list and detail sit side by side.
          selectedId={isDesktop ? selected?.id : undefined}
          onSelect={select}
        />
      }
      detail={
        selected && <GoalDetailPanel key={selected.id} goal={selected} onDeleted={clearSelection} />
      }
    />
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
