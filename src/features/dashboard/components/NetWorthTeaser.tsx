import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useFormatters, useNetWorth } from '@/hooks'
import { ROUTES } from '@/lib/routes'

/** A shortcut, not a metric: one compact line linking to the net worth screen. */
export function NetWorthTeaser() {
  const { t } = useTranslation('dashboard')
  const { money } = useFormatters()
  const { data } = useNetWorth()

  if (!data) return null

  return (
    <Link
      to={ROUTES.netWorth}
      className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-ink/5"
    >
      <span className="text-ink-muted">{t('netWorth.label')}</span>
      <span className="ml-auto font-medium tabular-nums">{money(data.netWorth)}</span>
      <ChevronRight className="size-4 text-ink-muted" aria-hidden />
    </Link>
  )
}
