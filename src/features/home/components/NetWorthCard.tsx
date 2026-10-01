import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Amount,
  Card,
  Eyebrow,
  interactiveCardClassName,
  SectionError,
  Skeleton,
} from '@/components/ui'
import { useNetWorth } from '@/hooks'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'

/** Compact shortcut: one figure, no delta (there's no history to compare against). */
export function NetWorthCard() {
  const { t } = useTranslation('home')
  const { data, isPending, isError, refetch } = useNetWorth()

  if (isError) {
    return (
      <Card as="section" aria-labelledby="net-worth-title" padding="md" className="space-y-4">
        <Eyebrow as="h2" id="net-worth-title">
          {t('netWorth.title')}
        </Eyebrow>
        <SectionError onRetry={() => void refetch()} />
      </Card>
    )
  }

  return (
    <Link
      to={ROUTES.netWorth}
      aria-busy={isPending || undefined}
      className={cn(interactiveCardClassName, 'group space-y-2 p-6')}
    >
      <Eyebrow as="h2">{t('netWorth.title')}</Eyebrow>
      {isPending ? (
        <Skeleton className="my-1 h-6 w-44" />
      ) : (
        <Amount
          value={data.netWorth}
          className={cn('block text-figure', data.netWorth < 0 && 'text-negative')}
        />
      )}
      <span className="inline-flex items-center gap-1 text-body-sm font-medium text-accent">
        {t('netWorth.seeDetail')}
        <ArrowRight
          aria-hidden
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  )
}
