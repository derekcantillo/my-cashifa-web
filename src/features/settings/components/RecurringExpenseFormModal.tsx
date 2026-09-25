import { useTranslation } from 'react-i18next'

import { InlineError, Modal, Skeleton } from '@/components/ui'
import { useRecurringExpenses } from '@/hooks'
import { useRecurringExpenseModalStore } from '@/store/recurringExpenseModalStore'

import { RecurringExpenseForm } from './RecurringExpenseForm'

/**
 * Mounted once in AppLayout while open. There's no GET /recurring-expenses/:id, so
 * edit mode picks the expense from the (usually cached) list.
 */
export function RecurringExpenseFormModal() {
  const { t } = useTranslation('settings')
  const { mode, recurringExpenseId, close } = useRecurringExpenseModalStore()
  const { data, isPending, isError, refetch } = useRecurringExpenses()
  const isEdit = mode === 'edit'
  const expense = data?.find(item => item.id === recurringExpenseId)

  return (
    <Modal title={isEdit ? t('recurring.editTitle') : t('recurring.createTitle')} onClose={close}>
      {!isEdit ? (
        <RecurringExpenseForm onDone={close} />
      ) : isError || (!isPending && !expense) ? (
        <div className="space-y-2">
          <p className="text-ink-muted">{t('recurring.loadError')}</p>
          {isError && <InlineError onRetry={() => void refetch()} />}
        </div>
      ) : isPending ? (
        <div className="space-y-5" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <RecurringExpenseForm expense={expense} onDone={close} />
      )}
    </Modal>
  )
}
