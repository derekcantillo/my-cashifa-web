import { useTranslation } from 'react-i18next'

import { formatPeriodRange, toLocale } from '@/lib/format'
import type { FinancialPeriod } from '@/types'

/**
 * Display label of a period. The backend `label` is Spanish-only, so other languages
 * rebuild it from the dates.
 */
export function usePeriodLabel(period: FinancialPeriod | undefined): string | undefined {
  const { t, i18n } = useTranslation()
  if (!period) return undefined
  if (i18n.resolvedLanguage === 'es') return period.label
  const { start, range } = formatPeriodRange(period, toLocale(i18n.resolvedLanguage))
  return range ?? t('period.ongoing', { start })
}
