import { Wallet } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Amount, buttonClassName, Card, CardHeader, EmptyState, Skeleton } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { cn } from '@/lib/cn'
import { isOpenLoan } from '@/lib/loanMath'
import { loanPath, ROUTES } from '@/lib/routes'
import type { Account, Loan, NetWorth } from '@/types'

import { assetAccounts, type AssetGroup } from '../lib/netWorthView'
import type { QueryState } from '../lib/queryState'
import { AssetSection, EmptyRow, linkRowClassName, rowClassName, SectionLink } from './sections'

interface AssetsCardProps {
  netWorth: QueryState<NetWorth>
  accounts: QueryState<Account[]>
  loans: QueryState<Loan[]>
  /** Id of each group's section heading (the hero bar scrolls to them). */
  headingIds: Record<AssetGroup, string>
}

/**
 * Subtotals (and the card's total) come from GET /net-worth — the source of truth; rows
 * come from the cached lists. Either can fail alone: without /net-worth the rows stay,
 * without a list its subtotal stays.
 */
export function AssetsCard({ netWorth, accounts, loans, headingIds }: AssetsCardProps) {
  const { t } = useTranslation('netWorth')
  const { money } = useFormatters()
  const assets = netWorth.data?.assets
  const totals = netWorth.data?.totals

  return (
    <Card as="section" aria-labelledby={`${headingIds.accounts}-card`} padding="md">
      <CardHeader
        title={t('assets.title')}
        titleId={`${headingIds.accounts}-card`}
        action={
          totals ? (
            <span className="text-body font-medium text-ink tabular-nums">
              {money(totals.assets)}
            </span>
          ) : (
            netWorth.isPending && <Skeleton className="h-4 w-28" />
          )
        }
      />

      <div className="mt-2 divide-y divide-line">
        <AssetSection
          headingId={headingIds.accounts}
          title={t('groups.accounts')}
          subtotal={assets?.accountsBalance}
          subtotalPending={netWorth.isPending}
          list={accounts}
          footer={<SectionLink to={ROUTES.settings}>{t('accounts.manage')}</SectionLink>}
        >
          {data => <AccountRows accounts={assetAccounts(data)} />}
        </AssetSection>

        <AssetSection
          headingId={headingIds.receivables}
          title={t('groups.receivables')}
          subtotal={assets?.receivables}
          subtotalPending={netWorth.isPending}
          list={loans}
          footer={<SectionLink to={ROUTES.loans}>{t('receivables.see')}</SectionLink>}
        >
          {data => <ReceivableRows loans={data} />}
        </AssetSection>
      </div>
    </Card>
  )
}

/**
 * Biggest balance first. Every account counts (the model has no archived state) except
 * credit cards, which the backend keeps out of `accountsBalance`.
 */
function AccountRows({ accounts }: { accounts: readonly Account[] }) {
  const { t } = useTranslation(['netWorth', 'settings'])

  if (accounts.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={Wallet}
        title={t('accounts.emptyTitle')}
        description={t('accounts.emptyBody')}
        action={
          <Link
            to={ROUTES.settings}
            className={buttonClassName({ variant: 'secondary', size: 'sm' })}
          >
            {t('accounts.emptyCta')}
          </Link>
        }
      />
    )
  }

  const sorted = [...accounts].sort((a, b) => b.currentBalance - a.currentBalance)
  return (
    <ul>
      {sorted.map(account => (
        <li key={account.id} className={rowClassName}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body text-ink">{account.name}</p>
            <p className="text-body-sm text-ink-muted">
              {t(`settings:accounts.types.${account.type}`)}
              {/* Without a date the balance counts every movement from zero: the starting
                  balance was never set, so net worth may be understated. */}
              {account.initialBalanceDate === null && (
                <>
                  {' · '}
                  <span className="text-ink-subtle">{t('accounts.noInitialBalance')}</span>{' '}
                  <Link
                    to={ROUTES.settings}
                    aria-label={t('accounts.defineLabel', { name: account.name })}
                    className="font-medium text-accent underline-offset-4 hover:underline"
                  >
                    {t('accounts.define')}
                  </Link>
                </>
              )}
            </p>
          </div>
          <Amount
            value={account.currentBalance}
            className={cn(
              'text-body font-medium',
              account.currentBalance < 0 ? 'text-negative' : 'text-ink',
            )}
          />
        </li>
      ))}
    </ul>
  )
}

/** Open loans (not PAID), biggest balance first — the same set `receivables` sums. */
function ReceivableRows({ loans }: { loans: readonly Loan[] }) {
  const { t } = useTranslation('netWorth')
  const { money } = useFormatters()
  const open = loans.filter(isOpenLoan).sort((a, b) => b.remainingAmount - a.remainingAmount)

  if (open.length === 0) return <EmptyRow>{t('receivables.empty')}</EmptyRow>
  return (
    <ul>
      {open.map(loan => (
        <li key={loan.id}>
          <Link to={loanPath(loan.id)} className={linkRowClassName}>
            <span className="min-w-0 flex-1 truncate text-body text-ink">{loan.borrowerName}</span>
            <span className="text-body text-ink-muted tabular-nums">
              <Trans
                t={t}
                i18nKey="receivables.pending"
                values={{ amount: money(loan.remainingAmount) }}
                components={{ amount: <span className="font-medium text-ink" /> }}
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
