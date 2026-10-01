import { RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'

import { Button } from './Button'

interface SectionErrorProps {
  onRetry: () => void
  /** Defaults to the generic "Something went wrong". */
  message?: string
  className?: string
}

/** Quiet, section-scoped error: the rest of the screen keeps working. */
export function SectionError({ onRetry, message, className }: SectionErrorProps) {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-sunken px-4 py-3',
        className,
      )}
    >
      <p className="text-body-sm text-ink-muted">{message ?? t('common.loadError')}</p>
      <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry}>
        {t('common.retry')}
      </Button>
    </div>
  )
}
