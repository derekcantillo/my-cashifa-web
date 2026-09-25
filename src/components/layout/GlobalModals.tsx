import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'

import { useAccountModalStore } from '@/store/accountModalStore'
import { useGoalModalStore } from '@/store/goalModalStore'
import { useLoanModalStore } from '@/store/loanModalStore'
import { useRecurringExpenseModalStore } from '@/store/recurringExpenseModalStore'
import { useTransactionModalStore } from '@/store/transactionModalStore'

// Each modal is its own chunk, loaded on first open, so form code stays out of the
// main bundle. Mounted only while open: every open starts from a fresh form.
const TransactionFormModal = lazy(() =>
  import('@/features/transactions/components/TransactionFormModal').then(m => ({
    default: m.TransactionFormModal,
  })),
)
const GoalFormModal = lazy(() =>
  import('@/features/goals/components/GoalFormModal').then(m => ({ default: m.GoalFormModal })),
)
const LoanFormModal = lazy(() =>
  import('@/features/loans/components/LoanFormModal').then(m => ({ default: m.LoanFormModal })),
)
const AccountFormModal = lazy(() =>
  import('@/features/settings/components/AccountFormModal').then(m => ({
    default: m.AccountFormModal,
  })),
)
const RecurringExpenseFormModal = lazy(() =>
  import('@/features/settings/components/RecurringExpenseFormModal').then(m => ({
    default: m.RecurringExpenseFormModal,
  })),
)

function LazyModal({ Modal }: { Modal: LazyExoticComponent<ComponentType> }) {
  return (
    <Suspense fallback={null}>
      <Modal />
    </Suspense>
  )
}

/** Every app-wide modal, mounted once in AppLayout and driven by its store. */
export function GlobalModals() {
  const transactionOpen = useTransactionModalStore(state => state.isOpen)
  const goalOpen = useGoalModalStore(state => state.isOpen)
  const loanOpen = useLoanModalStore(state => state.isOpen)
  const accountOpen = useAccountModalStore(state => state.isOpen)
  const recurringOpen = useRecurringExpenseModalStore(state => state.isOpen)

  return (
    <>
      {transactionOpen && <LazyModal Modal={TransactionFormModal} />}
      {goalOpen && <LazyModal Modal={GoalFormModal} />}
      {loanOpen && <LazyModal Modal={LoanFormModal} />}
      {accountOpen && <LazyModal Modal={AccountFormModal} />}
      {recurringOpen && <LazyModal Modal={RecurringExpenseFormModal} />}
    </>
  )
}
