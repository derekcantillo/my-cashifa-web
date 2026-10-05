import { useTranslation } from 'react-i18next'

import { Modal, SectionError, Skeleton } from '@/components/ui'
import { useLoans } from '@/hooks'
import { useLoanModalStore } from '@/store/loanModalStore'

import { LoanForm } from './LoanForm'
import { RepaymentForm } from './RepaymentForm'

/**
 * Mounted once in AppShell while the store says it's open: create / edit a loan, or log
 * a repayment. Edit and repay read the loan from the list (it carries the balance).
 */
export function LoanFormModal() {
  const { t } = useTranslation('loans')
  const { mode, loanId, close } = useLoanModalStore()
  const { data: loans, isPending, isError, refetch } = useLoans()
  const loan = mode === 'create' ? undefined : loans?.find(item => item.id === loanId)
  const title =
    mode === 'repay'
      ? t('repayment.title')
      : mode === 'edit'
        ? t('form.editTitle')
        : t('form.createTitle')

  return (
    <Modal title={title} onClose={close}>
      {mode === 'create' ? (
        <LoanForm onDone={close} />
      ) : isError ? (
        <SectionError message={t('form.loadError')} onRetry={() => void refetch()} />
      ) : isPending ? (
        <div className="space-y-5" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !loan ? (
        <p className="text-body text-ink-muted">{t('form.loadError')}</p>
      ) : mode === 'repay' ? (
        <RepaymentForm loan={loan} onDone={close} />
      ) : (
        <LoanForm loan={loan} onDone={close} />
      )}
    </Modal>
  )
}
