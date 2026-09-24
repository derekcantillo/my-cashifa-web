import { useTranslation } from 'react-i18next'

import { InlineError, Skeleton } from '@/components/ui'
import { useFormatters, useTransactions } from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { ROUTES } from '@/lib/routes'
import { getTransactionDirection } from '@/lib/transactionDirection'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types'

import { SectionLink } from './SectionLink'

const MAX_ITEMS = 6

export function RecentTransactionsList({ periodId }: { periodId: string | undefined }) {
  const { t } = useTranslation('dashboard')
  const { data, isPending, isError, refetch } = useTransactions(periodId)

  const recent = [...(data ?? [])]
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    .slice(0, MAX_ITEMS)

  return (
    <section
      aria-labelledby="recent-title"
      className="rounded-2xl border border-border bg-surface-elevated p-6"
    >
      <h2 id="recent-title" className="font-semibold">
        {t('recent.title')}
      </h2>

      <div className="mt-4">
        {isError ? (
          <InlineError onRetry={() => void refetch()} />
        ) : isPending ? (
          <ul className="divide-y divide-border" aria-busy>
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="flex items-center gap-4 py-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </li>
            ))}
          </ul>
        ) : recent.length === 0 ? (
          <p className="py-6 text-ink-muted">{t('recent.empty')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map(transaction => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </ul>
        )}
      </div>

      {recent.length > 0 && (
        <div className="mt-4">
          <SectionLink to={ROUTES.transactions}>{t('recent.seeAll')}</SectionLink>
        </div>
      )}
    </section>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const { t } = useTranslation(['categories'])
  const { money, relativeDay } = useFormatters()
  const meta = CATEGORY_META[transaction.category]
  const Icon = meta.icon
  const category = t(meta.translationKey)
  const direction = getTransactionDirection(transaction.type)

  return (
    <li className="flex items-center gap-4 py-3">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{
          color: meta.color,
          backgroundColor: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
        }}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{transaction.description || category}</p>
        <p className="truncate text-sm text-ink-muted">
          {transaction.description ? `${category} · ` : ''}
          {relativeDay(transaction.transactionDate)}
        </p>
      </div>
      <p
        className={cn(
          'shrink-0 font-medium tabular-nums',
          direction === 'in' && 'text-success',
          direction === 'out' && 'text-danger',
        )}
      >
        {direction === 'in' ? '+' : '−'}
        {money(transaction.amount)}
      </p>
    </li>
  )
}
