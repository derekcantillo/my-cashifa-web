import { HandCoins } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, CardHeader, EmptyState, SectionError, Skeleton } from '@/components/ui'
import { useFormatters, useLoan } from '@/hooks'

const VISIBLE = 8

/** Repayments come only with GET /loans/:id (the list doesn't carry them). */
export function RepaymentHistory({ loanId }: { loanId: string }) {
  const { t } = useTranslation('loans')
  const { money, shortDate } = useFormatters()
  const { data, isPending, isError, refetch } = useLoan(loanId)
  const [expanded, setExpanded] = useState(false)
  const repayments = data?.repayments ?? []
  const visible = expanded ? repayments : repayments.slice(0, VISIBLE)

  return (
    <section aria-labelledby="repayments-title" className="space-y-2">
      <CardHeader
        titleId="repayments-title"
        title={
          repayments.length > 0
            ? `${t('history.title')} (${repayments.length})`
            : t('history.title')
        }
      />
      {isError ? (
        <SectionError message={t('history.loadError')} onRetry={() => void refetch()} />
      ) : isPending ? (
        <div aria-busy className="space-y-3 py-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : repayments.length === 0 ? (
        <EmptyState
          size="sm"
          icon={HandCoins}
          title={t('history.emptyTitle')}
          description={t('history.emptyBody')}
        />
      ) : (
        <>
          {/* Newest first, as the API sends them. */}
          <ul className="divide-y divide-line">
            {visible.map(repayment => (
              <li key={repayment.id} className="flex min-h-14 items-center gap-4 py-2">
                <span className="w-24 shrink-0 text-body-sm text-ink-muted tabular-nums">
                  {shortDate(repayment.paidAt)}
                </span>
                <span className="min-w-0 flex-1 truncate text-body text-ink">{repayment.note}</span>
                <span className="shrink-0 text-body font-medium text-positive tabular-nums">
                  +{money(repayment.amount)}
                </span>
              </li>
            ))}
          </ul>
          {repayments.length > VISIBLE && (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={expanded}
              onClick={() => setExpanded(value => !value)}
              className="-ml-3"
            >
              {expanded
                ? t('history.showLess')
                : t('history.showAll', { count: repayments.length })}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
