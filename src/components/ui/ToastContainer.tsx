import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'

/** Mounted once in AppLayout. Announces toasts politely to screen readers. */
export function ToastContainer() {
  const { t } = useTranslation()
  const toasts = useToastStore(state => state.toasts)
  const dismiss = useToastStore(state => state.dismiss)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-surface-elevated py-3 pr-2 pl-4 text-sm shadow-lg',
            toast.variant === 'error' && 'text-danger',
          )}
        >
          <p className="flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label={t('common.close')}
            className="rounded-md p-1 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  )
}
