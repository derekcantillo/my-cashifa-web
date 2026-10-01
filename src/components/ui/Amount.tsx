import { useFormatters } from '@/hooks'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'

interface AmountProps {
  value: number
  /** Colors by sign: positive green, negative terracotta, zero neutral. */
  colorBySign?: boolean
  /** Prefixes "+" on positive values (the "−" is always shown). */
  showPlus?: boolean
  compact?: boolean
  className?: string
}

/** Money with tabular numerals. Font and size come from the context (`className`). */
export function Amount({
  value,
  colorBySign = false,
  showPlus = false,
  compact = false,
  className,
}: AmountProps) {
  // Re-renders on language change; the locale itself is passed explicitly.
  const { locale } = useFormatters()
  const text = formatMoney(value, {
    locale,
    compact,
    signDisplay: showPlus ? 'exceptZero' : 'auto',
  })

  return (
    <span
      className={cn(
        'tabular-nums',
        colorBySign && value > 0 && 'text-positive',
        colorBySign && value < 0 && 'text-negative',
        className,
      )}
    >
      {text}
    </span>
  )
}
