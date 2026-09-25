import { useTranslation } from 'react-i18next'

import { InlineError, Skeleton } from '@/components/ui'
import { useRecurringExpenses } from '@/hooks'
import { useRecurringExpenseModalStore } from '@/store/recurringExpenseModalStore'

import { RecurringExpenseRow } from './RecurringExpenseRow'
import { AddButton, SettingsSection } from './SettingsSection'

export function RecurringExpensesSection() {
  const { t } = useTranslation('settings')
  const { data, isPending, isError, refetch } = useRecurringExpenses()
  const openModal = useRecurringExpenseModalStore(state => state.open)

  return (
    <SettingsSection
      id="recurring-title"
      title={t('recurring.title')}
      action={<AddButton label={t('recurring.add')} onClick={() => openModal('create')} />}
    >
      {isError ? (
        <div className="py-4">
          <InlineError onRetry={() => void refetch()} />
        </div>
      ) : isPending ? (
        <div className="space-y-4 py-4" aria-busy="true">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ) : data.length === 0 ? (
        <p className="py-6 text-ink-muted">{t('recurring.empty')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {[...data]
            .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
            .map(expense => (
              <RecurringExpenseRow key={expense.id} expense={expense} />
            ))}
        </ul>
      )}
    </SettingsSection>
  )
}
