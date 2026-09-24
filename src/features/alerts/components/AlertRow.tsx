import { useTranslation } from 'react-i18next'

import { useFormatters } from '@/hooks'
import { AlertTypeIcon } from '@/lib/alertMeta'
import { cn } from '@/lib/utils'
import type { Alert } from '@/types'

interface AlertRowProps {
  alert: Alert
  onMarkRead: (id: string) => void
}

/**
 * The dot IS the unread indicator — a read alert simply has none (no extra check
 * icon). Unread rows are buttons that mark the alert as read; read rows are plain,
 * de-emphasized text with nothing left to do.
 */
export function AlertRow({ alert, onMarkRead }: AlertRowProps) {
  const { t } = useTranslation('alerts')
  const { relativeDay } = useFormatters()

  const content = (
    <>
      <span className="flex h-6 w-2 shrink-0 items-center" aria-hidden>
        {!alert.read && <span className="size-2 rounded-full bg-brand" />}
      </span>
      <AlertTypeIcon type={alert.type} className="mt-0.5 size-5 shrink-0 text-ink-muted" />
      <span className={cn('min-w-0 flex-1', alert.read ? 'text-ink-muted' : 'font-medium')}>
        {!alert.read && <span className="sr-only">{t('unreadLabel')}: </span>}
        {alert.message}
      </span>
      <span className="shrink-0 text-sm text-ink-muted">{relativeDay(alert.sentAt)}</span>
    </>
  )

  // Negative margin lines the hover background up with the list; applied to both variants.
  const rowClassName = '-mx-3 flex w-[calc(100%+1.5rem)] items-start gap-3 px-3 py-4 text-left'

  if (alert.read) {
    return <div className={rowClassName}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={() => onMarkRead(alert.id)}
      className={cn(
        rowClassName,
        '-mx-3 w-[calc(100%+1.5rem)] rounded-lg transition-colors hover:bg-ink/5',
      )}
    >
      {content}
    </button>
  )
}
