import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

interface DeleteConfirmationProps {
  title: string
  isPending: boolean
  /** Shown when the delete request failed. */
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
  className?: string
}

/** Second step of a two-step delete, rendered in place (never `window.confirm`). */
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
      className={cn('space-y-3 rounded-xl border border-danger/30 bg-danger/5 p-4', className)}
    >
      <div>
        <p id={`${id}-title`} className="font-medium">
          {title}
        </p>
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {t('common.cantUndo')}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-60"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- move focus into the confirmation that just replaced the delete button
          autoFocus
          className="rounded-lg bg-danger px-3 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-danger/90 disabled:opacity-60"
        >
          {isPending ? t('common.deleting') : t('common.confirm')}
        </button>
      </div>
    </div>
  )
}
