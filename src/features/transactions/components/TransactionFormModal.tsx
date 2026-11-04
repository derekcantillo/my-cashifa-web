import { useTranslation } from 'react-i18next'

import { Modal, SectionError, Skeleton } from '@/components/ui'
import { useRecurringExpenses, useTransaction } from '@/hooks'
import { isTransfer } from '@/lib/transfers'
import { useTransactionModalStore } from '@/store/transactionModalStore'

import { isLoanMovement } from '../lib/loanTransactions'
import { LoanMovementView } from './LoanMovementView'
import { TransactionForm } from './TransactionForm'
import { TransferForm } from './TransferForm'

/**
 * Mounted once in AppShell while the store says it's open. One modal for creating,
 * viewing and editing: edit mode opens with the movement loaded and editable. Transfers
 * get their own form (no type nor category), both to create and to edit.
 */
export function TransactionFormModal() {
  const { t } = useTranslation('transactions')
  const { mode, transactionId, recurringExpense, transfer, close } = useTransactionModalStore()
  const isEdit = mode === 'edit'
  const query = useTransaction(isEdit ? transactionId : undefined)
  // Names linked recurring expenses; usually already cached by the Gastos screen.
  const { data: recurringExpenses = [] } = useRecurringExpenses()

  const title =
    mode === 'transfer'
      ? t(transfer?.cardPayment ? 'form.cardPaymentTitle' : 'form.transferTitle')
      : !isEdit
        ? t('form.createTitle')
        : query.data && isLoanMovement(query.data)
          ? t('form.loanTitle')
          : query.data && isTransfer(query.data)
            ? t('form.editTransferTitle')
            : t('form.editTitle')

  return (
    <Modal title={title} onClose={close}>
      {mode === 'transfer' ? (
        <TransferForm preset={transfer} onDone={close} />
      ) : !isEdit ? (
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
      ) : isLoanMovement(query.data) ? (
        // Read-only: editing it here would desync the loan and the account balance.
        <LoanMovementView transaction={query.data} />
      ) : isTransfer(query.data) ? (
        <TransferForm transaction={query.data} onDone={close} />
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
