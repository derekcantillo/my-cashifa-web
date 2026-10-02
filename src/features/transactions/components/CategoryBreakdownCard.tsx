import { useTranslation } from 'react-i18next'

import { Card, CardHeader, CategoryBreakdownView, SectionError, Skeleton } from '@/components/ui'
import { useReportDistribution } from '@/hooks'
import { buildCategoryBreakdown } from '@/lib/categoryBreakdown'
import { transactionsByCategoryPath } from '@/lib/routes'

interface CategoryBreakdownCardProps {
  periodId: string | undefined
  className?: string
}

/**
 * Expense split by category (GET /reports/distribution — EXPENSE only), colored by
 * rank with the same helper as Reportes, so a category has the same color on both.
 */
export function CategoryBreakdownCard({ periodId, className }: CategoryBreakdownCardProps) {
  const { t } = useTranslation('transactions')
  const { data, isPending, isError, refetch } = useReportDistribution(periodId)
  const breakdown = data ? buildCategoryBreakdown(data) : null

  return (
    <Card as="section" aria-labelledby="breakdown-title" className={className}>
      <CardHeader title={t('breakdown.title')} titleId="breakdown-title" />

      {isError ? (
        <SectionError onRetry={() => void refetch()} className="mt-4" />
      ) : isPending || !breakdown ? (
        <div aria-busy className="mt-4 space-y-4">
          <Skeleton className="h-2.5 w-full rounded-full" />
          {[0, 1, 2].map(index => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      ) : breakdown.items.length === 0 ? (
        <p className="mt-3 text-body text-ink-muted">{t('breakdown.empty')}</p>
      ) : (
        <div className="mt-4">
          <CategoryBreakdownView breakdown={breakdown} hrefFor={transactionsByCategoryPath} />
        </div>
      )}
    </Card>
  )
}
