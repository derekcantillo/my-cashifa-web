import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { formatMoney, formatRelativeDay, formatShortDate, toLocale } from '@/lib/format'

/** Money/date formatters bound to the active UI language. */
export function useFormatters() {
  const { i18n } = useTranslation()
  const locale = toLocale(i18n.resolvedLanguage)

  return useMemo(
    () => ({
      locale,
      money: (amount: number) => formatMoney(amount, locale),
      relativeDay: (iso: string) => formatRelativeDay(iso, locale),
      shortDate: (iso: string) => formatShortDate(iso, locale),
    }),
    [locale],
  )
}
