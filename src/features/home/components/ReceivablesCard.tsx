import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Amount, Card, Eyebrow, interactiveCardClassName, SectionError } from '@/components/ui'
import { useLoans } from '@/hooks'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'

/** Money lent and still owed. Only rendered when there's at least one active loan. */
export function ReceivablesCard() {
  const { t } = useTranslation('home')
  const { data, isError, refetch } = useLoans()

  if (isError) {
    return (
      <Card as="section" aria-labelledby="receivables-title" className="space-y-4">
        <Eyebrow as="h2" id="receivables-title">
          {t('receivables.title')}
        </Eyebrow>
        <SectionError onRetry={() => void refetch()} />
      </Card>
    )
  }

  // `LoanStatus` is ACTIVE | PARTIALLY_PAID | PAID: anything not PAID is still owed.
  const active = (data ?? []).filter(loan => loan.status !== 'PAID')
  // While loading there's nothing to reserve: it's the last block of its column.
  if (active.length === 0) return null
  const owed = active.reduce((sum, loan) => sum + loan.remainingAmount, 0)

  return (
    <Link to={ROUTES.loans} className={cn(interactiveCardClassName, 'group space-y-2 p-6')}>
      <Eyebrow as="h2">{t('receivables.title')}</Eyebrow>
      <Amount value={owed} className="block text-figure" />
      <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-body-sm text-ink-muted">
          {t('receivables.count', { count: active.length })}
        </span>
        <span className="inline-flex items-center gap-1 text-body-sm font-medium text-accent">
          {t('receivables.seeLoans')}
          <ArrowRight
            aria-hidden
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  )
}
