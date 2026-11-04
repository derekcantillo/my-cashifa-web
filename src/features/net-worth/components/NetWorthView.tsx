import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Enter, PageHeader } from '@/components/ui'
import { useFormatters } from '@/hooks'
import type { Account, Goal, Loan, NetWorth } from '@/types'

import { formatAsOfDate, type AssetGroup } from '../lib/netWorthView'
import type { QueryState } from '../lib/queryState'
import { AssetsCard } from './AssetsCard'
import { GoalsSetAsideCard } from './GoalsSetAsideCard'
import { LiabilitiesCard } from './LiabilitiesCard'
import { NetWorthHero } from './NetWorthHero'
import { UnconfiguredCardsCard } from './UnconfiguredCardsCard'

export interface NetWorthViewProps {
  netWorth: QueryState<NetWorth>
  accounts: QueryState<Account[]>
  loans: QueryState<Loan[]>
  goals: QueryState<Goal[]>
}

/**
 * Today's snapshot — not tied to the selected period. Presentational: the page passes the
 * cached queries, the design showcase passes mock states.
 */
export function NetWorthView({ netWorth, accounts, loans, goals }: NetWorthViewProps) {
  const { t } = useTranslation('netWorth')
  const { locale } = useFormatters()
  const id = useId()
  const headingIds: Record<AssetGroup, string> = {
    accounts: `${id}-accounts`,
    receivables: `${id}-receivables`,
  }

  /** A bar segment brings its section into view and moves focus to its heading. */
  const selectGroup = (group: AssetGroup) => {
    const heading = document.getElementById(headingIds[group])
    if (!heading) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    heading.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    heading.focus({ preventScroll: true })
  }

  return (
    <div className="space-y-10">
      <Enter order={0}>
        <PageHeader
          eyebrow={t('asOf', { date: formatAsOfDate(new Date(), locale) })}
          title={t('title')}
        />
      </Enter>

      <Enter order={1}>
        <NetWorthHero netWorth={netWorth} onSelectGroup={selectGroup} />
      </Enter>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Enter order={2} className="min-w-0 lg:col-span-8">
          <AssetsCard
            netWorth={netWorth}
            accounts={accounts}
            loans={loans}
            headingIds={headingIds}
          />
        </Enter>
        <Enter order={3} className="min-w-0 space-y-6 lg:col-span-4">
          <LiabilitiesCard netWorth={netWorth.data} accounts={accounts} />
          <UnconfiguredCardsCard netWorth={netWorth.data} />
          <GoalsSetAsideCard netWorth={netWorth} goals={goals} />
        </Enter>
      </div>
    </div>
  )
}
