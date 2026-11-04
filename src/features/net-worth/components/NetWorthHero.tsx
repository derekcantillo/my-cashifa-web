import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Amount, SectionError, Skeleton } from '@/components/ui'
import type { NetWorth } from '@/types'

import { DEBTS_IMPLEMENTED } from '../liabilitiesSupport'
import { buildAssetComposition, type AssetGroup } from '../lib/netWorthView'
import type { QueryState } from '../lib/queryState'
import { AssetComposition } from './AssetComposition'

interface NetWorthHeroProps {
  netWorth: QueryState<NetWorth>
  onSelectGroup: (group: AssetGroup) => void
}

/** Straight on the canvas: the figure (ink; negative tone below 0) and its composition. */
export function NetWorthHero({ netWorth, onSelectGroup }: NetWorthHeroProps) {
  const { t } = useTranslation('netWorth')
  const { data, isPending, isError, refetch } = netWorth
  const labelId = useId()

  return (
    <section aria-labelledby={labelId} className="space-y-6">
      <div className="space-y-3">
        <h2 id={labelId} className="text-body text-ink-muted">
          {t('heroLabel')}
        </h2>
        {isError ? (
          <SectionError onRetry={() => void refetch()} className="max-w-md" />
        ) : isPending || !data ? (
          <Skeleton className="h-11 w-64 max-w-full sm:h-14 sm:w-96" />
        ) : (
          <Amount
            value={data.netWorth}
            variant="hero"
            className={data.netWorth < 0 ? 'text-negative' : 'text-ink'}
          />
        )}
        {!DEBTS_IMPLEMENTED && (
          <p className="text-body text-ink-muted">{t('liabilitiesPending')}</p>
        )}
      </div>

      {isPending && !isError ? (
        <div aria-hidden className="space-y-3">
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      ) : (
        data &&
        !isError && (
          <AssetComposition
            composition={buildAssetComposition(data.assets)}
            onSelect={onSelectGroup}
          />
        )
      )}
    </section>
  )
}
