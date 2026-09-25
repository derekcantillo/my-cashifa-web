import { useTranslation } from 'react-i18next'

import { useFormatters, useUpdateRecurringExpense } from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { cn } from '@/lib/utils'
import { useRecurringExpenseModalStore } from '@/store/recurringExpenseModalStore'
import { useToastStore } from '@/store/toastStore'
import type { RecurringExpense } from '@/types'

/** The row opens the edit modal; the switch (a sibling, not nested) toggles `active` directly. */
export function RecurringExpenseRow({ expense }: { expense: RecurringExpense }) {
  const { t } = useTranslation(['settings', 'categories'])
  const { money } = useFormatters()
  const openModal = useRecurringExpenseModalStore(state => state.open)
  const update = useUpdateRecurringExpense()
  const pushToast = useToastStore(state => state.push)
  const meta = CATEGORY_META[expense.category]
  const Icon = meta.icon

  const toggle = () =>
    update.mutate(
      { id: expense.id, input: { active: !expense.active } },
      { onError: () => pushToast(t('settings:recurring.toggleError'), 'error') },
    )

  return (
    <li className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => openModal('edit', expense.id)}
        className={cn(
          '-ml-3 flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-4 text-left transition-colors hover:bg-ink/5',
          !expense.active && 'text-ink-muted',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            !expense.active && 'opacity-50',
          )}
          style={{
            color: meta.color,
            backgroundColor: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
          }}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{expense.name}</span>
          <span className="block truncate text-sm text-ink-muted">
            {t(meta.translationKey)} ·{' '}
            {t('settings:recurring.dayLabel', { day: expense.dayOfMonth })}
          </span>
        </span>
        <span className="shrink-0 font-medium tabular-nums">{money(expense.estimatedAmount)}</span>
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={expense.active}
        aria-label={t('settings:recurring.activeLabel', { name: expense.name })}
        disabled={update.isPending}
        onClick={toggle}
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-60',
          expense.active ? 'bg-brand' : 'bg-ink/20',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-surface-elevated shadow-sm transition-transform',
            expense.active && 'translate-x-4',
          )}
        />
      </button>
    </li>
  )
}
