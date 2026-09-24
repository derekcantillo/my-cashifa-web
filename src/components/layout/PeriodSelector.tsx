import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@/components/ui'
import { useSelectedPeriod } from '@/hooks'
import { formatPeriodRange, toLocale } from '@/lib/format'

export function PeriodSelector() {
  const { t, i18n } = useTranslation('layout')
  const { period, isLoading, goToPrevious, goToNext, canGoPrevious, canGoNext } =
    useSelectedPeriod()

  let label: string
  if (isLoading) {
    label = t('header.periodLoading')
  } else if (!period) {
    label = t('header.noPeriod')
  } else {
    // The backend `label` is Spanish-only, so the range is formatted per language.
    const { start, range } = formatPeriodRange(period, toLocale(i18n.resolvedLanguage))
    label = range ?? t('header.periodOngoing', { start })
  }

  return (
    <div role="group" aria-label={t('header.period')} className="flex items-center gap-1">
      <IconButton
        label={t('header.previousPeriod')}
        icon={ChevronLeft}
        onClick={goToPrevious}
        disabled={!canGoPrevious}
      />
      <span
        aria-live="polite"
        className={
          isLoading
            ? 'min-w-32 animate-pulse text-center text-sm text-ink-muted'
            : 'min-w-32 text-center text-sm font-medium tabular-nums'
        }
      >
        {label}
      </span>
      <IconButton
        label={t('header.nextPeriod')}
        icon={ChevronRight}
        onClick={goToNext}
        disabled={!canGoNext}
      />
    </div>
  )
}
