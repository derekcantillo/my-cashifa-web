import { useTranslation } from 'react-i18next'

import { Card, CardHeader, CategoryBreakdownView, SectionError, Skeleton } from '@/components/ui'
import { useReportDistribution } from '@/hooks'
import { buildCategoryBreakdown } from '@/lib/categoryBreakdown'
import { transactionsByCategoryPath } from '@/lib/routes'
import { cn } from '@/lib/cn'

/**
 * GET /reports/distribution (EXPENSE only, debt payments not included), colored by rank
 * with the same helper as the Gastos card, so a category keeps its color on both.
 */
export function CategoryCard({
  periodId,
  className,
}: {
  periodId: string | undefined
  className?: string
}) {
  const { t } = useTranslation('reports')
  const { data, isPending, isError, refetch } = useReportDistribution(periodId)
  const breakdown = data ? buildCategoryBreakdown(data) : null

  return (
    <Card
      as="section"
      aria-labelledby="categories-title"
      className={cn('flex flex-col', className)}
    >
      <CardHeader title={t('categories.title')} titleId="categories-title" />
      {isError ? (
        <SectionError onRetry={() => void refetch()} className="mt-4" />
      ) : isPending || !breakdown ? (
        <div aria-busy className="mt-5 space-y-4">
          <Skeleton className="h-2.5 w-full rounded-full" />
          {[0, 1, 2, 3, 4].map(index => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      ) : breakdown.items.length === 0 ? (
        <p className="mt-3 text-body text-ink-muted">{t('categories.empty')}</p>
      ) : (
        <div className="mt-5">
          <CategoryBreakdownView breakdown={breakdown} hrefFor={transactionsByCategoryPath} />
        </div>
      )}
    </Card>
  )
}
