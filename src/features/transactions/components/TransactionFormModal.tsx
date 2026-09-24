import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { IconButton, InlineError, Skeleton } from '@/components/ui'
import { useTransaction } from '@/hooks'
import { useTransactionModalStore } from '@/store/transactionModalStore'

import { TransactionForm } from './TransactionForm'

/**
 * Mounted once in AppLayout while the store says it's open. Uses a native
 * `<dialog>`: focus trapping, Escape to close and the top layer come for free.
 */
export function TransactionFormModal() {
  const { t } = useTranslation('transactions')
  const { mode, transactionId, close } = useTransactionModalStore()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isEdit = mode === 'edit'
  const {
    data: transaction,
    isPending,
    isError,
    refetch,
  } = useTransaction(isEdit ? transactionId : undefined)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    // A click on the <dialog> element itself (not its content) is a click on the backdrop.
    // Keyboard users close with Escape (native `cancel` event below).
    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) close()
    }
    dialog.addEventListener('click', onBackdropClick)
    return () => {
      dialog.removeEventListener('click', onBackdropClick)
      dialog.close()
    }
  }, [close])

  const titleId = 'transaction-form-title'

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={event => {
        event.preventDefault()
        close()
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-0 text-ink backdrop:bg-overlay/50"
    >
      <div className="p-6">
        <header className="mb-6 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {isEdit ? t('form.editTitle') : t('form.createTitle')}
          </h2>
          <IconButton label={t('form.close')} icon={X} onClick={close} className="-mr-2" />
        </header>

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
      </div>
    </dialog>
  )
}
