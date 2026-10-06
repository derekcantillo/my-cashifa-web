import { ArrowRight, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Amount,
  buttonClassName,
  Card,
  CardHeader,
  EmptyState,
  SectionError,
  Skeleton,
} from '@/components/ui'
import { useFormatters } from '@/hooks'
import { cn } from '@/lib/cn'
import { isOpenLoan } from '@/lib/loanMath'
import { goalPath, loanPath, ROUTES } from '@/lib/routes'
import type { Account, Goal, Loan, NetWorth } from '@/types'

import { totalAssets, type AssetGroup } from '../lib/netWorthView'
import type { QueryState } from '../lib/queryState'

interface AssetsCardProps {
  netWorth: QueryState<NetWorth>
  accounts: QueryState<Account[]>
  loans: QueryState<Loan[]>
  goals: QueryState<Goal[]>
  /** Id of each group's section heading (the hero bar scrolls to them). */
  headingIds: Record<AssetGroup, string>
}

/**
 * Subtotals (and the card's total) come from GET /net-worth — the source of truth; rows
 * come from the cached lists. Either can fail alone: without /net-worth the rows stay,
 * without a list its subtotal stays.
 */
export function AssetsCard({ netWorth, accounts, loans, goals, headingIds }: AssetsCardProps) {
  const { t } = useTranslation('netWorth')
  const { money } = useFormatters()
  const assets = netWorth.data?.assets

  return (
    <Card as="section" aria-labelledby={`${headingIds.accounts}-card`} padding="md">
      <CardHeader
        title={t('assets.title')}
        titleId={`${headingIds.accounts}-card`}
        action={
          assets ? (
            <span className="text-body font-medium text-ink tabular-nums">
              {money(totalAssets(assets))}
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
          {data => <AccountRows accounts={data} />}
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

        <AssetSection
          headingId={headingIds.goals}
          title={t('groups.goals')}
          subtotal={assets?.goalsSavings}
          subtotalPending={netWorth.isPending}
          list={goals}
          footer={<SectionLink to={ROUTES.goals}>{t('goals.see')}</SectionLink>}
        >
          {data => <GoalRows goals={data} />}
        </AssetSection>
      </div>
    </Card>
  )
}

interface AssetSectionProps<T> {
  headingId: string
  title: string
  subtotal: number | undefined
  subtotalPending: boolean
  list: QueryState<T>
  footer: ReactNode
  children: (data: T) => ReactNode
}

function AssetSection<T>({
  headingId,
  title,
  subtotal,
  subtotalPending,
  list,
  footer,
  children,
}: AssetSectionProps<T>) {
  return (
    <section aria-labelledby={headingId} className="py-5 last:pb-0">
      <div className="flex items-baseline justify-between gap-4">
        {/* Focus target of the hero bar's segments. */}
        <h3
          id={headingId}
          tabIndex={-1}
          className="scroll-mt-24 text-body-sm font-semibold text-ink focus:outline-none"
        >
          {title}
        </h3>
        {subtotal !== undefined ? (
          <Amount
            value={subtotal}
            className={cn('text-body font-medium', subtotal < 0 ? 'text-negative' : 'text-ink')}
          />
        ) : (
          subtotalPending && <Skeleton className="h-4 w-24" />
        )}
      </div>

      <div className="mt-2">
        {list.isError ? (
          <SectionError onRetry={() => void list.refetch()} className="my-2" />
        ) : list.isPending || list.data === undefined ? (
          <div aria-busy className="space-y-3 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : (
          children(list.data)
        )}
      </div>

      {!list.isError && <div className="mt-2">{footer}</div>}
    </section>
  )
}

const rowClassName = '-mx-3 flex min-h-12 items-center gap-4 rounded-md px-3 py-2'
const linkRowClassName = cn(rowClassName, 'transition-tactile hover:bg-surface-sunken/70')

/** Biggest balance first. Every account counts: the model has no archived state. */
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

/** Goals holding money (any status: the backend sums every goal), biggest first. */
function GoalRows({ goals }: { goals: readonly Goal[] }) {
  const { t } = useTranslation('netWorth')
  const saving = goals
    .filter(goal => goal.currentAmount > 0)
    .sort((a, b) => b.currentAmount - a.currentAmount)

  if (saving.length === 0) return <EmptyRow>{t('goals.empty')}</EmptyRow>
  return (
    <ul>
      {saving.map(goal => (
        <li key={goal.id}>
          <Link to={goalPath(goal.id)} className={linkRowClassName}>
            <span className="min-w-0 flex-1 truncate text-body text-ink">{goal.name}</span>
            <Amount value={goal.currentAmount} className="text-body font-medium text-ink" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="flex min-h-12 items-center text-body text-ink-muted">{children}</p>
}

function SectionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={buttonClassName({ variant: 'link', size: 'sm' })}>
      {children}
      <ArrowRight aria-hidden className="size-3.5" />
    </Link>
  )
}
