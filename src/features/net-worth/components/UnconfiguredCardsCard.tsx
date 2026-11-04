import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Amount, Button, Card, CardHeader } from '@/components/ui'
import { ROUTES } from '@/lib/routes'
import { useTransactionModalStore } from '@/store/transactionModalStore'
import type { NetWorth } from '@/types'

import { rowClassName, SectionLink } from './sections'

/**
 * Credit cards without a limit: their stored balance doesn't say how much is owed (the
 * old card held the available credit), so the backend keeps them out of every total.
 * Shown apart so they don't silently vanish, with "Pagar tarjeta" and a way to set them
 * up ("Ajustar al extracto" in Mis productos). Nothing when there are none.
 */
export function UnconfiguredCardsCard({ netWorth }: { netWorth: NetWorth | undefined }) {
  const { t } = useTranslation('netWorth')
  const titleId = useId()
  const cards = netWorth?.info.unconfiguredCards ?? []
  const openTransfer = useTransactionModalStore(state => state.openTransfer)

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
            <Button
              size="sm"
              variant="ghost"
              aria-label={t('liabilities.payLabel', { name: card.name })}
              onClick={() => openTransfer({ toAccountId: card.id, cardPayment: true })}
            >
              {t('liabilities.pay')}
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <SectionLink to={ROUTES.settings}>{t('cards.configure')}</SectionLink>
      </div>
    </Card>
  )
}
