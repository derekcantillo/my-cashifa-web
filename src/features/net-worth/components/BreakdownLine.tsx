import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useFormatters } from '@/hooks'
import { cn } from '@/lib/utils'

interface BreakdownLineProps {
  icon: LucideIcon
  label: string
  amount: number
  /** Not implemented on the backend yet: muted, with "Próximamente" instead of an amount. */
  comingSoon?: boolean
}

export function BreakdownLine({
  icon: Icon,
  label,
  amount,
  comingSoon = false,
}: BreakdownLineProps) {
  const { t } = useTranslation('netWorth')
  const { money } = useFormatters()

  return (
    <li className={cn('flex items-center gap-3 py-3', comingSoon && 'text-ink-muted')}>
      <Icon className="size-5 shrink-0 text-ink-muted" aria-hidden />
      <span className="flex-1">{label}</span>
      {comingSoon ? (
        <span className="text-sm">{t('comingSoon')}</span>
      ) : (
        <span className="font-medium tabular-nums">{money(amount)}</span>
      )}
    </li>
  )
}
