import { ChevronRight } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, ProgressBar } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { cn } from '@/lib/cn'
import { dateKeyToDate, formatDate, formatPercent } from '@/lib/format'
import { displayPercent, progressPercent, reachedOn, savingsSeries } from '@/lib/goalMath'
import type { Goal } from '@/types'

import { timeLeftLabel } from '../lib/goalView'

interface GoalListProps {
  inProgress: readonly Goal[]
  completed: readonly Goal[]
  /** Highlighted item (desktop); `undefined` on phones, where the list is its own view. */
  selectedId: string | undefined
  onSelect: (goal: Goal) => void
}

/**
 * Goals in one card. Each item is a button: Tab reaches the list, ↑/↓/Home/End move
 * between items, Enter/Space select. The selected one has `aria-current`.
 */
export function GoalList({ inProgress, completed, selectedId, onSelect }: GoalListProps) {
  const { t } = useTranslation('goals')
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(event.key)) return
    const items = [
      ...(listRef.current?.querySelectorAll<HTMLButtonElement>('[data-goal-item]') ?? []),
    ].filter(item => item.offsetParent !== null) // skip items inside a closed <details>
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (index === -1) return
    event.preventDefault()
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[next].focus()
  }

  return (
    <Card as="section" aria-label={t('list.label')} padding="sm">
      {/* Arrow keys bubble up from the item buttons (the focusable, native elements). */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- delegation only */}
      <div ref={listRef} onKeyDown={onKeyDown}>
        {inProgress.length > 0 && (
          <ul className="space-y-1">
            {inProgress.map(goal => (
              <li key={goal.id}>
                <GoalItem goal={goal} selected={goal.id === selectedId} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        )}

        {completed.length > 0 && (
          <details
            className={cn('group', inProgress.length > 0 && 'mt-2 border-t border-line pt-2')}
          >
            <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-sm px-3 text-body-sm font-medium text-ink-muted transition-tactile hover:text-ink [&::-webkit-details-marker]:hidden">
              <ChevronRight
                aria-hidden
                className="size-4 transition-transform group-open:rotate-90"
              />
              {t('list.completed', { count: completed.length })}
            </summary>
            <ul className="mt-1 space-y-1">
              {completed.map(goal => (
                <li key={goal.id}>
                  <CompletedItem
                    goal={goal}
                    selected={goal.id === selectedId}
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </Card>
  )
}

interface ItemProps {
  goal: Goal
  selected: boolean
  onSelect: (goal: Goal) => void
}

/** Selected: sunken background and a 2px accent edge — no extra shadow. */
function itemClassName(selected: boolean) {
  return cn(
    'w-full rounded-l-none rounded-r-md border-l-2 px-3 text-left transition-tactile',
    selected ? 'border-accent bg-surface-sunken' : 'border-transparent hover:bg-surface-sunken/60',
  )
}

function GoalItem({ goal, selected, onSelect }: ItemProps) {
  const { t } = useTranslation('goals')
  const { locale, money } = useFormatters()
  const percent = formatPercent(displayPercent(goal.currentAmount, goal.targetAmount) / 100, {
    locale,
  })

  return (
    <button
      type="button"
      data-goal-item
      aria-current={selected || undefined}
      onClick={() => onSelect(goal)}
      className={cn(itemClassName(selected), 'space-y-2 py-3')}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-body font-medium text-ink">{goal.name}</span>
        {goal.status === 'PAUSED' && (
          <span className="shrink-0 text-body-sm text-ink-muted">{t('status.PAUSED')}</span>
        )}
      </span>
      <span className="flex items-baseline justify-between gap-3 text-body-sm tabular-nums">
        <span className="text-ink">
          {t('list.saved', { saved: money(goal.currentAmount), target: money(goal.targetAmount) })}
        </span>
        <span className="text-ink-muted">{percent}</span>
      </span>
      <ProgressBar
        value={progressPercent(goal.currentAmount, goal.targetAmount)}
        label={t('list.progress', { name: goal.name })}
        tone={goal.status === 'PAUSED' ? 'neutral' : 'accent'}
      />
      <span className="block text-body-sm text-ink-muted">
        {t('list.by', {
          date: formatDate(goal.targetDate, {
            locale,
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        })}
        {' · '}
        {timeLeftLabel(t, goal.targetDate, locale)}
      </span>
    </button>
  )
}

function CompletedItem({ goal, selected, onSelect }: ItemProps) {
  const { t } = useTranslation('goals')
  const { locale, money } = useFormatters()
  const reached = reachedOn(savingsSeries(goal), goal.targetAmount)

  return (
    <button
      type="button"
      data-goal-item
      aria-current={selected || undefined}
      onClick={() => onSelect(goal)}
      className={cn(itemClassName(selected), 'flex items-baseline gap-3 py-2.5')}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm text-ink">{goal.name}</span>
        {reached && (
          <span className="block text-body-sm text-ink-muted">
            {t('list.reachedOn', {
              date: formatDate(dateKeyToDate(reached), {
                locale,
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
            })}
          </span>
        )}
      </span>
      <span className="shrink-0 text-body-sm text-ink-muted tabular-nums">
        {money(goal.currentAmount)}
      </span>
    </button>
  )
}
