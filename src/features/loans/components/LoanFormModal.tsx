import { useTranslation } from 'react-i18next'

import { InlineError, Modal, Skeleton } from '@/components/ui'
import { useLoan } from '@/hooks'
import { useLoanModalStore } from '@/store/loanModalStore'

import { LoanForm } from './LoanForm'

/** Mounted once in AppLayout while the store says it's open. */
export function LoanFormModal() {
  const { t } = useTranslation('loans')
  const { mode, loanId, close } = useLoanModalStore()
  const isEdit = mode === 'edit'
  const { data: loan, isPending, isError, refetch } = useLoan(isEdit ? loanId : undefined)

  return (
    <Modal title={isEdit ? t('form.editTitle') : t('form.createTitle')} onClose={close}>
      {!isEdit ? (
        <LoanForm onDone={close} />
      ) : isError ? (
        <div className="space-y-2">
          <p className="text-ink-muted">{t('form.loadError')}</p>
          <InlineError onRetry={() => void refetch()} />
        </div>
      ) : isPending ? (
        <div className="space-y-5" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <LoanForm loan={loan} onDone={close} />
      )}
    </Modal>
  )
}
