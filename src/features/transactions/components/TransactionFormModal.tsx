import { useTranslation } from 'react-i18next'

import { Modal, SectionError, Skeleton } from '@/components/ui'
import { useRecurringExpenses, useTransaction } from '@/hooks'
import { useTransactionModalStore } from '@/store/transactionModalStore'

import { TransactionForm } from './TransactionForm'

/**
 * Mounted once in AppShell while the store says it's open. One modal for creating,
 * viewing and editing: edit mode opens with the movement loaded and editable.
 */
export function TransactionFormModal() {
  const { t } = useTranslation('transactions')
  const { mode, transactionId, recurringExpense, close } = useTransactionModalStore()
  const isEdit = mode === 'edit'
  const query = useTransaction(isEdit ? transactionId : undefined)
  // Names linked recurring expenses; usually already cached by the Gastos screen.
  const { data: recurringExpenses = [] } = useRecurringExpenses()

  return (
    <Modal title={isEdit ? t('form.editTitle') : t('form.createTitle')} onClose={close}>
      {!isEdit ? (
        <TransactionForm
          recurringExpense={recurringExpense}
          recurringExpenses={recurringExpenses}
          onDone={close}
        />
      ) : query.isError ? (
        <SectionError message={t('form.loadError')} onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <div className="space-y-6" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <TransactionForm
          transaction={query.data}
          recurringExpenses={recurringExpenses}
          onDone={close}
        />
      )}
    </Modal>
  )
}
