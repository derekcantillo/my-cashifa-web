import { ArrowRight, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { cleanAlertMessage } from '@/lib/alertMessage'
import { AlertTypeIcon, isKnownAlertType, isRiskAlert } from '@/lib/alertMeta'
import { cn } from '@/lib/cn'
import { formatTime } from '@/lib/format'
import type { Alert } from '@/types'

import { hasMeaningfulTime } from '../lib/alertList'

/** What the contextual action of an alert does (decided by the screen from its type). */
export type AlertAction =
  | { kind: 'navigate'; label: string; onRun: () => void }
  | { kind: 'register'; label: string; onRun: () => void }
  | { kind: 'registered' }
  | { kind: 'none' }

interface AlertItemProps {
  alert: Alert
  action: AlertAction
  onMarkRead: (id: string) => void
  /** Last of the list: no bottom padding (the container's closes it). */
  last?: boolean
}

/**
 * One alert: unread dot (empty space when read, to keep alignment), type icon with no
 * chip (warning tone only for real risks), type label + time (the day is in the group
 * heading), the cleaned message, then — 8px below — its actions. 16px above and below;
 * an alert without actions differs only by that row.
 */
export function AlertItem({ alert, action, onMarkRead, last = false }: AlertItemProps) {
  const { t } = useTranslation('alerts')
  const { locale } = useFormatters()
  const label = isKnownAlertType(alert.type) ? t(`types.${alert.type}`) : t('types.UNKNOWN')
  const hasContextual = action.kind !== 'none'

  return (
    <article
      aria-label={`${label}${alert.read ? '' : ` · ${t('list.unreadLabel')}`}`}
      className={cn('flex gap-3 py-4', last && 'pb-0')}
    >
      <span aria-hidden className="flex h-6 w-2 shrink-0 items-center">
        {!alert.read && <span className="size-2 rounded-full bg-accent" />}
      </span>
      <AlertTypeIcon
        type={alert.type}
        className={cn(
          'mt-[3px] size-[18px] shrink-0',
          isRiskAlert(alert.type) ? 'text-warning' : 'text-ink-muted',
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-body font-semibold text-ink">{label}</h3>
          {hasMeaningfulTime(alert.sentAt) && (
            <time
              dateTime={alert.sentAt}
              className="shrink-0 text-body-sm text-ink-muted tabular-nums"
            >
              {formatTime(alert.sentAt, locale)}
            </time>
          )}
        </div>
        <p className={cn('mt-1 text-body text-pretty', alert.read ? 'text-ink-muted' : 'text-ink')}>
          {cleanAlertMessage(alert.message)}
        </p>
        {(hasContextual || !alert.read) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {(action.kind === 'navigate' || action.kind === 'register') && (
              <Button variant="link" size="sm" onClick={action.onRun}>
                {action.label}
                <ArrowRight aria-hidden className="size-3.5" />
              </Button>
            )}
            {action.kind === 'registered' && (
              <span className="inline-flex min-h-9 items-center gap-1 text-body-sm text-ink-subtle">
                <Check aria-hidden className="size-3.5" />
                {t('actions.registered')}
              </span>
            )}
            {hasContextual && !alert.read && <span aria-hidden className="h-4 w-px bg-line" />}
            {!alert.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkRead(alert.id)}
                // Its text starts at the edge when it's the only action.
                className={cn(!hasContextual && '-ml-3.5')}
              >
                {t('actions.markRead')}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
