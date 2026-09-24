import { useTranslation } from 'react-i18next'

import { useFormatters } from '@/hooks'
import type { LoanRepayment } from '@/types'

/** Light rows, newest first. */
export function RepaymentList({ repayments }: { repayments: LoanRepayment[] }) {
  const { t } = useTranslation('loans')
  const { money, shortDate } = useFormatters()
  const sorted = [...repayments].sort((a, b) => b.paidAt.localeCompare(a.paidAt))

  return (
    <section aria-labelledby="repayments-title" className="space-y-2">
      <h2 id="repayments-title" className="font-semibold">
        {t('history.title')}
      </h2>
      {sorted.length === 0 ? (
        <p className="py-4 text-ink-muted">{t('history.empty')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map(repayment => (
            <li key={repayment.id} className="flex items-baseline gap-4 py-3">
              <span className="w-24 shrink-0 text-sm text-ink-muted">
                {shortDate(repayment.paidAt)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{repayment.note}</span>
              <span className="shrink-0 font-medium tabular-nums">+{money(repayment.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
