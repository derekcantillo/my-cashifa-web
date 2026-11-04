import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Amount, Card, CardHeader } from '@/components/ui'
import type { NetWorth } from '@/types'

import { rowClassName } from './sections'

/**
 * Credit cards without a configured limit: their stored balance doesn't say how much is
 * owed (the existing card holds the available credit), so the backend keeps them out of
 * every total. Shown apart so they don't silently vanish. Nothing when there are none.
 */
export function UnconfiguredCardsCard({ netWorth }: { netWorth: NetWorth | undefined }) {
  const { t } = useTranslation('netWorth')
  const titleId = useId()
  const cards = netWorth?.info.unconfiguredCards ?? []

  if (cards.length === 0) return null
  return (
    <Card as="section" aria-labelledby={titleId} padding="md">
      <CardHeader
        title={t('cards.title')}
        titleId={titleId}
        action={<span className="text-body-sm text-ink-muted">{t('cards.notCounted')}</span>}
      />
      <p className="mt-3 text-body-sm text-ink-muted text-pretty">{t('cards.body')}</p>
      <ul className="mt-2">
        {cards.map(card => (
          <li key={card.id} className={rowClassName}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body text-ink">{card.name}</p>
              <p className="text-body-sm text-ink-muted">{t('cards.storedBalance')}</p>
            </div>
            <Amount value={card.currentBalance} className="text-body text-ink-muted" />
          </li>
        ))}
      </ul>
    </Card>
  )
}
