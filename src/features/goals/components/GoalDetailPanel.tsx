import { CircleCheck, MoreHorizontal, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Amount,
  Button,
  Card,
  CardHeader,
  Divider,
  Eyebrow,
  Menu,
  ProgressBar,
  type MenuItem,
} from '@/components/ui'
import { useFormatters, useUpdateGoal } from '@/hooks'
import { dateKeyToDate, formatDate, formatPercent } from '@/lib/format'
import {
  currentPace,
  displayPercent,
  progressPercent,
  projectedReachDate,
  reachedOn,
  savingsSeries,
} from '@/lib/goalMath'
import { useGoalModalStore } from '@/store/goalModalStore'
import { useToastStore } from '@/store/toastStore'
import type { Goal } from '@/types'

import { timeLeftLabel } from '../lib/goalView'
import { ContributionHistory } from './ContributionHistory'
import { DeleteGoalDialog } from './DeleteGoalDialog'
import { GoalProgressChart } from './GoalProgressChart'

interface GoalDetailPanelProps {
  goal: Goal
  /** After deleting: the screen moves the selection elsewhere. */
  onDeleted: () => void
}

export function GoalDetailPanel({ goal, onDeleted }: GoalDetailPanelProps) {
  const { t } = useTranslation('goals')
  const { locale, money } = useFormatters()
  const openModal = useGoalModalStore(state => state.open)
  const contribute = useGoalModalStore(state => state.contribute)
  const updateGoal = useUpdateGoal()
  const pushToast = useToastStore(state => state.push)
  const [deleting, setDeleting] = useState(false)

  const now = new Date()
  const completed = goal.status === 'COMPLETED'
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const plan = goal.plan
  const timeLeft = timeLeftLabel(t, goal)
  const pace = completed ? null : currentPace(goal.contributions, now)
  const paceReach = pace ? projectedReachDate(remaining, pace.monthly, now) : null
  const reached = completed ? reachedOn(savingsSeries(goal), goal.targetAmount) : null
  const longDate = (date: Date | string) =>
    formatDate(date, { locale, day: 'numeric', month: 'short', year: 'numeric' })

  const setStatus = (status: 'ACTIVE' | 'PAUSED') =>
    updateGoal.mutate(
      { id: goal.id, input: { status } },
      {
        onSuccess: () => pushToast(t(status === 'PAUSED' ? 'toast.paused' : 'toast.resumed')),
        onError: () => pushToast(t('toast.statusError'), 'error'),
      },
    )

  const menuItems: MenuItem[] = [
    {
      id: 'edit',
      label: t('detail.edit'),
      icon: Pencil,
      onSelect: () => openModal('edit', goal.id),
    },
    ...(completed
      ? []
      : [
          goal.status === 'PAUSED'
            ? {
                id: 'resume',
                label: t('detail.resume'),
                icon: Play,
                onSelect: () => setStatus('ACTIVE'),
              }
            : {
                id: 'pause',
                label: t('detail.pause'),
                icon: Pause,
                onSelect: () => setStatus('PAUSED'),
              },
        ]),
    {
      id: 'delete',
      label: t('detail.delete'),
      icon: Trash2,
      danger: true,
      onSelect: () => setDeleting(true),
    },
  ]

  return (
    <Card as="section" aria-labelledby="goal-detail-title" padding="lg" className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 id="goal-detail-title" className="text-heading break-words text-ink">
            {goal.name}
          </h2>
          <p className="text-body-sm text-ink-muted">{t(`status.${goal.status}`)}</p>
        </div>
        <Menu
          label={t('detail.actions')}
          icon={MoreHorizontal}
          items={menuItems}
          className="-mr-2"
        />
      </header>

      <div className="space-y-3">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <Amount value={goal.currentAmount} className="text-figure-lg text-ink" />
          <span className="text-body text-ink-muted tabular-nums">
            {t('detail.of', { target: money(goal.targetAmount) })}
          </span>
        </p>
        <div className="flex items-center gap-3">
          <ProgressBar
            value={progressPercent(goal.currentAmount, goal.targetAmount)}
            label={t('list.progress', { name: goal.name })}
            tone={goal.status === 'PAUSED' ? 'neutral' : 'accent'}
            size="md"
            className="flex-1"
          />
          <span className="w-11 text-right text-body-sm font-medium text-ink tabular-nums">
            {formatPercent(displayPercent(goal.currentAmount, goal.targetAmount) / 100, { locale })}
          </span>
        </div>
        {completed && (
          <p className="flex items-center gap-2 text-body text-ink">
            <CircleCheck aria-hidden className="size-[18px] text-positive" />
            {reached
              ? t('detail.reachedOn', { date: longDate(dateKeyToDate(reached)) })
              : t('detail.reached')}
          </p>
        )}
      </div>

      {!completed && (
        <>
          <dl className="grid gap-5 sm:grid-cols-3">
            <Datum label={t('detail.targetDate')}>
              <span className="block">{longDate(goal.targetDate)}</span>
              {timeLeft && (
                <span className="block text-body-sm font-normal text-ink-muted">{timeLeft}</span>
              )}
            </Datum>
            <Datum label={t('detail.remaining')}>
              <Amount value={remaining} />
            </Datum>
            {/* From the backend plan; paused goals have none. */}
            {plan && (
              <Datum label={t('detail.required')}>
                {plan.isOverdue ? (
                  <>
                    <Amount value={plan.requiredMonthlyContribution} />
                    <span className="block text-body-sm font-normal text-ink-muted">
                      {t('detail.overdueAll')}
                    </span>
                  </>
                ) : (
                  t('detail.perMonth', { amount: money(plan.requiredMonthlyContribution) })
                )}
              </Datum>
            )}
            {pace && (
              <Datum label={t('detail.pace')} className="sm:col-span-3">
                {t('detail.perMonth', { amount: money(pace.monthly) })}
                {paceReach && (
                  <span className="block text-body-sm font-normal text-ink-muted">
                    {t('detail.paceProjection', {
                      month: formatDate(dateKeyToDate(paceReach), {
                        locale,
                        month: 'long',
                        year: 'numeric',
                      }),
                    })}
                  </span>
                )}
              </Datum>
            )}
          </dl>
          {goal.status === 'PAUSED' && (
            <p className="text-body-sm text-ink-muted">{t('detail.paused')}</p>
          )}
          <Button icon={Plus} onClick={() => contribute(goal.id)}>
            {t('detail.contribute')}
          </Button>
        </>
      )}

      <Divider />

      <section aria-labelledby="goal-chart-title" className="space-y-4">
        <CardHeader title={t('chart.title')} titleId="goal-chart-title" />
        {goal.contributions.length > 0 ? (
          <GoalProgressChart goal={goal} />
        ) : (
          <div className="space-y-4">
            {plan && (
              <p className="text-body text-ink-muted">
                {plan.isOverdue
                  ? t('chart.noContributionsOverdue', { amount: money(remaining) })
                  : t('chart.noContributions', {
                      amount: money(plan.requiredMonthlyContribution),
                    })}
              </p>
            )}
            {!completed && (
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => contribute(goal.id)}>
                {t('history.first')}
              </Button>
            )}
          </div>
        )}
      </section>

      <Divider />

      <ContributionHistory contributions={goal.contributions} />

      {deleting && (
        <DeleteGoalDialog
          goal={goal}
          onCancel={() => setDeleting(false)}
          onDeleted={() => {
            setDeleting(false)
            onDeleted()
          }}
        />
      )}
    </Card>
  )
}

function Datum({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <dt>
        <Eyebrow as="span">{label}</Eyebrow>
      </dt>
      <dd className="mt-1.5 text-body font-medium text-ink tabular-nums">{children}</dd>
    </div>
  )
}
