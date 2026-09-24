import { useTranslation } from 'react-i18next'

import { InlineError, TransactionRow, TransactionRowsSkeleton } from '@/components/ui'
import { useTransactions } from '@/hooks'
import { ROUTES } from '@/lib/routes'
import { useTransactionModalStore } from '@/store/transactionModalStore'

import { SectionLink } from './SectionLink'

const MAX_ITEMS = 6

export function RecentTransactionsList({ periodId }: { periodId: string | undefined }) {
  const { t } = useTranslation('dashboard')
  const { data, isPending, isError, refetch } = useTransactions(periodId)
  const openModal = useTransactionModalStore(state => state.open)

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
          <TransactionRowsSkeleton />
        ) : recent.length === 0 ? (
          <p className="py-6 text-ink-muted">{t('recent.empty')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map(transaction => (
              <li key={transaction.id}>
                <TransactionRow
                  transaction={transaction}
                  onSelect={({ id }) => openModal('edit', id)}
                />
              </li>
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
