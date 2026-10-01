import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@/components/ui'
import { useSelectedPeriod } from '@/hooks'
import { cn } from '@/lib/cn'
import { formatPeriodRange, toLocale } from '@/lib/format'

/** Pill with ← label →. The selected period is global (`useSelectedPeriod`). */
export function PeriodSelector() {
  const { t, i18n } = useTranslation()
  const { period, isLoading, goToPrevious, goToNext, canGoPrevious, canGoNext } =
    useSelectedPeriod()

  let label: string
  if (isLoading) {
    label = t('period.loading')
  } else if (!period) {
    label = t('period.none')
  } else if (i18n.resolvedLanguage === 'es') {
    label = period.label
  } else {
    // The backend `label` is Spanish-only: rebuild it from the dates in other languages.
    const { start, range } = formatPeriodRange(period, toLocale(i18n.resolvedLanguage))
    label = range ?? t('period.ongoing', { start })
  }

  return (
    <div
      role="group"
      aria-label={t('period.label')}
      className="inline-flex h-10 items-center gap-0.5 rounded-full bg-surface-raised px-1 shadow-raised"
    >
      <IconButton
        label={t('period.previous')}
        icon={ChevronLeft}
        size="sm"
        onClick={goToPrevious}
        disabled={!canGoPrevious}
        className="size-8 rounded-full"
      />
      <span
        aria-live="polite"
        className={cn(
          'min-w-36 px-1 text-center text-body-sm font-medium whitespace-nowrap tabular-nums',
          isLoading ? 'animate-pulse text-ink-muted' : 'text-ink',
        )}
      >
        {label}
      </span>
      <IconButton
        label={t('period.next')}
        icon={ChevronRight}
        size="sm"
        onClick={goToNext}
        disabled={!canGoNext}
        className="size-8 rounded-full"
      />
    </div>
  )
}
