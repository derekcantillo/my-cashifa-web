import { useTranslation } from 'react-i18next'

import { InlineError, Modal, Skeleton } from '@/components/ui'
import { useTransaction } from '@/hooks'
import { useTransactionModalStore } from '@/store/transactionModalStore'

import { TransactionForm } from './TransactionForm'

/** Mounted once in AppShell while the store says it's open. */
export function TransactionFormModal() {
  const { t } = useTranslation('transactions')
  const { mode, transactionId, close } = useTransactionModalStore()
  const isEdit = mode === 'edit'
  const {
    data: transaction,
    isPending,
    isError,
    refetch,
  } = useTransaction(isEdit ? transactionId : undefined)

  return (
    <Modal title={isEdit ? t('form.editTitle') : t('form.createTitle')} onClose={close}>
      {!isEdit ? (
        <TransactionForm onDone={close} />
      ) : isError ? (
        <div className="space-y-2">
          <p className="text-ink-muted">{t('form.loadError')}</p>
          <InlineError onRetry={() => void refetch()} />
        </div>
      ) : isPending ? (
        <div className="space-y-5" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <TransactionForm transaction={transaction} onDone={close} />
      )}
    </Modal>
  )
}
