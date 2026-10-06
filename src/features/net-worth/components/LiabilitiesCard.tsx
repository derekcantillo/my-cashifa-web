import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Amount, Card, CardHeader } from '@/components/ui'
import type { NetWorth } from '@/types'

import { LIABILITIES_IMPLEMENTED } from '../liabilitiesSupport'

/**
 * The backend returns `debts` and `creditCardsDebt` fixed at 0 (not modelled yet): a "$0"
 * would read as "no debts", so it says they aren't tracked, with no filler rows.
 */
export function LiabilitiesCard({ netWorth }: { netWorth: NetWorth | undefined }) {
  const { t } = useTranslation('netWorth')
  const titleId = useId()
  const liabilities = netWorth?.liabilities

  return (
    <Card as="section" aria-labelledby={titleId} padding="md">
      <CardHeader
        title={t('liabilities.title')}
        titleId={titleId}
        action={
          LIABILITIES_IMPLEMENTED ? (
            liabilities && (
              <Amount
                value={liabilities.debts + liabilities.creditCardsDebt}
                className="text-body font-medium text-ink"
              />
            )
          ) : (
            <span className="text-body-sm text-ink-muted">{t('liabilities.notTracked')}</span>
          )
        }
      />
      {!LIABILITIES_IMPLEMENTED && (
        <p className="mt-3 text-body-sm text-ink-muted text-pretty">{t('liabilities.body')}</p>
      )}
    </Card>
  )
}
