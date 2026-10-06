import { useTranslation } from 'react-i18next'

import { SegmentedBar, useSegmentHighlight, type BarSegment } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { cn } from '@/lib/cn'
import { formatShare } from '@/lib/format'

import {
  shareForDisplay,
  type AssetComposition as Composition,
  type AssetGroup,
} from '../lib/netWorthView'

interface AssetCompositionProps {
  composition: Composition
  /** Brings the group's section into view (the bar segments are buttons that do it). */
  onSelect: (group: AssetGroup) => void
}

/**
 * Assets by group: segmented bar (colored by rank) + text legend with name, amount and
 * share. Without a meaningful bar (assets at 0 or a negative group) only the legend
 * remains, with amounts alone.
 */
export function AssetComposition({ composition, onSelect }: AssetCompositionProps) {
  const { t } = useTranslation('netWorth')
  const { locale, money } = useFormatters()
  const highlight = useSegmentHighlight()

  if (composition.items.length === 0) return null

  const share = (item: Composition['items'][number]) => formatShare(shareForDisplay(item), locale)
  const segments: BarSegment[] = composition.items.map(item => ({
    key: item.group,
    label: t('composition.item', {
      name: t(`groups.${item.group}`),
      amount: money(item.amount),
      percent: share(item),
    }),
    weight: item.percent ?? 0,
    fillClass: item.fillClass ?? '',
    onClick: () => onSelect(item.group),
  }))

  return (
    <div className="space-y-3">
      {composition.showBar && (
        <SegmentedBar label={t('composition.label')} segments={segments} highlight={highlight} />
      )}
      <ul
        aria-label={composition.showBar ? undefined : t('composition.label')}
        className="flex flex-wrap gap-x-6 gap-y-1.5"
      >
        {composition.items.map(item => (
          <li
            key={item.group}
            {...highlight.highlight(item.group)}
            className={cn(
              'flex items-center gap-2 text-body-sm transition-opacity duration-150 motion-reduce:transition-none',
              highlight.dimmed(item.group) && 'opacity-55',
            )}
          >
            {item.fillClass && (
              <span aria-hidden className={cn('size-2 shrink-0 rounded-full', item.fillClass)} />
            )}
            <span className="text-ink-muted">{t(`groups.${item.group}`)}</span>
            <span
              className={cn(
                'font-medium tabular-nums',
                item.amount < 0 ? 'text-negative' : 'text-ink',
              )}
            >
              {money(item.amount)}
            </span>
            {composition.showBar && (
              <span className="text-ink-muted tabular-nums">{share(item)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
