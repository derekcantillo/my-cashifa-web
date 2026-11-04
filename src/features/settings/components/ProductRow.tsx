import { Banknote, CreditCard, Landmark, Smartphone, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Amount, Button } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { dateKeyToDate, formatDayMonth } from '@/lib/format'
import { useAccountModalStore } from '@/store/accountModalStore'
import { useTransactionModalStore } from '@/store/transactionModalStore'
import type { Account } from '@/types'

import {
  cardSummaryParts,
  debitCardLabel,
  formatCardSummary,
  productKind,
  type ProductKind,
} from '../lib/products'
import { InitialBalanceForm } from './InitialBalanceForm'

const ICONS: Record<ProductKind, LucideIcon> = {
  account: Landmark,
  wallet: Smartphone,
  cash: Banknote,
  card: CreditCard,
}

/**
 * One product of "Mis productos". Accounts and wallets: balance (and the debit card).
 * Credit card: what's owed, available, over limit and limit, cut and next payment, and
 * its actions; without a limit it only asks to be configured.
 */
export function ProductRow({ account }: { account: Account }) {
  const { t } = useTranslation('settings')
  const { money, locale } = useFormatters()
  const openAccount = useAccountModalStore(state => state.open)
  const openTransfer = useTransactionModalStore(state => state.openTransfer)
  const [editingBalance, setEditingBalance] = useState(false)
  const kind = productKind(account.type)
  const Icon = ICONS[kind]
  const card = account.creditCard
  const summary = cardSummaryParts(card)

  const details = [
    t(`accounts.types.${account.type}`),
    debitCardLabel(account, t('products.debitCard')),
    kind === 'card' && account.cardLast4 ? `•••• ${account.cardLast4}` : null,
  ].filter(Boolean)

  const cycle = card
    ? [
        card.statementDay !== null &&
          (card.statementDay === 31
            ? t('products.cutEndOfMonth')
            : t('products.cutDay', { day: card.statementDay })),
        card.nextPaymentDate &&
          t('products.nextPayment', {
            date: formatDayMonth(dateKeyToDate(card.nextPaymentDate), locale),
          }),
        card.activePlans > 0 && t('products.activePlans', { count: card.activePlans }),
      ].filter(Boolean)
    : []

  const payCard = () => openTransfer({ toAccountId: account.id, cardPayment: true })

  return (
    <li className="space-y-3 py-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-body font-medium text-ink">{account.name}</p>
          <p className="text-body-sm text-ink-muted">{details.join(' · ')}</p>
          {summary && (
            <p className="text-body-sm text-ink">
              {formatCardSummary(
                summary,
                (key, amount) => t(`products.summary.${key}`, { amount }),
                money,
              )}
            </p>
          )}
          {cycle.length > 0 && <p className="text-body-sm text-ink-muted">{cycle.join(' · ')}</p>}
          {kind === 'card' && !summary && (
            <p className="text-body-sm text-warning">{t('products.unconfigured')}</p>
          )}
        </div>
        {kind !== 'card' && (
          <Amount
            value={account.currentBalance}
            className={account.currentBalance < 0 ? 'text-negative' : 'text-ink'}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2 pl-8">
        {kind === 'card' ? (
          <>
            <Button size="sm" variant="secondary" onClick={payCard}>
              {t('products.payCard')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => openAccount(account.id)}>
              {summary ? t('products.configure') : t('products.configureCard')}
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={() => setEditingBalance(value => !value)}>
              {t('accounts.newInitialBalance')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => openAccount(account.id)}>
              {t('products.edit')}
            </Button>
          </>
        )}
      </div>
      {editingBalance && (
        <InitialBalanceForm accountId={account.id} onDone={() => setEditingBalance(false)} />
      )}
    </li>
  )
}
