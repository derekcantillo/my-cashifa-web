import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Amount, Button, Card, CardHeader, Skeleton } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { useTransactionModalStore } from '@/store/transactionModalStore'
import type { Account, NetWorth } from '@/types'

import { DEBTS_IMPLEMENTED } from '../liabilitiesSupport'
import { liabilityCards } from '../lib/netWorthView'
import type { QueryState } from '../lib/queryState'
import { rowClassName } from './sections'

/**
 * Credit card debt from `liabilities.creditCardsDebt` (cards with a limit), one row per
 * card with "Pagar tarjeta". Own debts aren't modelled yet: said so instead of a "$0".
 */
export function LiabilitiesCard({
  netWorth,
  accounts,
}: {
  netWorth: NetWorth | undefined
  accounts: QueryState<Account[]>
}) {
  const { t } = useTranslation('netWorth')
  const { money } = useFormatters()
  const titleId = useId()
  const openTransfer = useTransactionModalStore(state => state.openTransfer)
  const liabilities = netWorth?.liabilities
  const cards = liabilityCards(accounts.data ?? [])

  return (
    <Card as="section" aria-labelledby={titleId} padding="md">
      <CardHeader
        title={t('liabilities.title')}
        titleId={titleId}
        action={
          liabilities ? (
            <Amount
              value={liabilities.debts + liabilities.creditCardsDebt}
              className="text-body font-medium text-ink"
            />
          ) : (
            <Skeleton className="h-4 w-24" />
          )
        }
      />
      {accounts.isPending ? (
        <Skeleton className="mt-3 h-10 w-full" />
      ) : cards.length === 0 ? (
        <p className="mt-3 text-body-sm text-ink-muted text-pretty">{t('liabilities.noCards')}</p>
      ) : (
        <ul className="mt-2">
          {cards.map(card => (
            <li key={card.id} className={rowClassName}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body text-ink">{card.name}</p>
                <p className="text-body-sm text-ink-muted">
                  {(card.creditCard?.overLimit ?? 0) > 0
                    ? t('liabilities.overLimit', { amount: money(card.creditCard?.overLimit ?? 0) })
                    : t('liabilities.available', {
                        amount: money(card.creditCard?.available ?? 0),
                      })}
                </p>
              </div>
              <Amount value={card.creditCard?.debt ?? 0} className="text-body text-ink" />
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
      )}
      {netWorth && netWorth.info.creditCardsAvailable > 0 && (
        <p className="mt-3 text-body-sm text-ink-muted">
          {t('liabilities.availableInfo', { amount: money(netWorth.info.creditCardsAvailable) })}
        </p>
      )}
      {!DEBTS_IMPLEMENTED && (
        <p className="mt-3 text-body-sm text-ink-muted text-pretty">{t('liabilities.debtsBody')}</p>
      )}
    </Card>
  )
}
