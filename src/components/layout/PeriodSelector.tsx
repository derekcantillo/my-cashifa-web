import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@/components/ui'

// TODO(Block 3): replace with the real financial period and wire up the arrows.
const MOCK_PERIOD = { start: new Date(2026, 8, 15), end: new Date(2026, 9, 14) }

export function PeriodSelector() {
  const { t, i18n } = useTranslation('layout')
  const language = i18n.resolvedLanguage

  const label = useMemo(
    () =>
      new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).formatRange(
        MOCK_PERIOD.start,
        MOCK_PERIOD.end,
      ),
    [language],
  )

  return (
    <div role="group" aria-label={t('header.period')} className="flex items-center gap-1">
      <IconButton label={t('header.previousPeriod')} icon={ChevronLeft} />
      <span className="min-w-28 text-center text-sm font-medium tabular-nums">{label}</span>
      <IconButton label={t('header.nextPeriod')} icon={ChevronRight} />
    </div>
  )
}
