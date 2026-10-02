import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'

import { Button } from './Button'
import { Modal } from './Modal'

interface DeleteConfirmationProps {
  title: string
  isPending: boolean
  /** Shown when the delete request failed. */
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
  className?: string
}

/**
 * Second step of a two-step delete, rendered in place (popovers and the forms of
 * screens not yet migrated). New flows use `ConfirmDeleteDialog`.
 */
export function DeleteConfirmation({
  title,
  isPending,
  error,
  onConfirm,
  onCancel,
  className,
}: DeleteConfirmationProps) {
  const { t } = useTranslation()
  const id = useId()

  return (
    <div
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-hint`}
      className={cn('space-y-3 rounded-md bg-negative-soft p-4', className)}
    >
      <div>
        <p id={`${id}-title`} className="text-body font-medium text-ink">
          {title}
        </p>
        <p id={`${id}-hint`} className="text-body-sm text-ink-muted">
          {t('common.cantUndo')}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-negative">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onConfirm}
          loading={isPending}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- move focus into the confirmation that just replaced the delete button
          autoFocus
        >
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  )
}

interface ConfirmDeleteDialogProps {
  title: string
  /** What is going to be deleted, and any consequence worth knowing. */
  children: ReactNode
  confirmLabel: string
  isPending: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

/** Delete confirmation as a small modal (400px) on top of the current one. */
export function ConfirmDeleteDialog({
  title,
  children,
  confirmLabel,
  isPending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation()

  return (
    <Modal
      size="sm"
      title={title}
      onClose={() => !isPending && onCancel()}
      footer={
        <>
          <Button variant="ghost" className="ml-auto" onClick={onCancel} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isPending}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-body text-ink-muted">
        {children}
        <p>{t('common.cantUndo')}</p>
        {error && (
          <p role="alert" className="text-body-sm text-negative">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
