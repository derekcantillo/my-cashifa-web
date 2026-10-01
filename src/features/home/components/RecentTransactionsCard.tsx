import { Plus, Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  SectionError,
  TransactionRow,
  TransactionRowsSkeleton,
} from '@/components/ui'
import { useTransactions } from '@/hooks'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'
import { useTransactionModalStore } from '@/store/transactionModalStore'

import { SectionLink } from './SectionLink'

const MAX_ITEMS = 6

interface RecentTransactionsCardProps {
  periodId: string | undefined
  className?: string
}

export function RecentTransactionsCard({ periodId, className }: RecentTransactionsCardProps) {
  const { t } = useTranslation('home')
  // Same query as the spending pace card: fetched once.
  const { data, isPending, isError, refetch } = useTransactions(periodId)
  const openModal = useTransactionModalStore(state => state.open)

  const recent = [...(data ?? [])]
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    .slice(0, MAX_ITEMS)

  return (
    <Card as="section" aria-labelledby="recent-title" className={cn('flex flex-col', className)}>
      <CardHeader title={t('recent.title')} titleId="recent-title" />

      <div className="mt-2 flex flex-1 flex-col">
        {isError ? (
          <SectionError onRetry={() => void refetch()} className="mt-4" />
        ) : isPending ? (
          <TransactionRowsSkeleton rows={MAX_ITEMS} />
        ) : recent.length === 0 ? (
          <EmptyState
            size="sm"
            icon={Receipt}
            title={t('recent.emptyTitle')}
            description={t('recent.emptyBody')}
            action={
              <Button size="sm" icon={Plus} onClick={() => openModal('create')}>
                {t('recent.register')}
              </Button>
            }
            className="my-auto"
          />
        ) : (
          <ul className="divide-y divide-line">
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
        <div className="mt-4 border-t border-line pt-4">
          <SectionLink to={ROUTES.transactions}>{t('recent.seeAll')}</SectionLink>
        </div>
      )}
    </Card>
  )
}
