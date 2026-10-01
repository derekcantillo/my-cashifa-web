import { useFormatters } from '@/hooks'
import { cn } from '@/lib/cn'
import { formatMoney, formatMoneyParts } from '@/lib/format'

interface AmountProps {
  value: number
  /** Colors by sign: positive green, negative terracotta, zero neutral. */
  colorBySign?: boolean
  /** Prefixes "+" on positive values (the "−" is always shown). */
  showPlus?: boolean
  compact?: boolean
  /**
   * `inline` (default): font and size come from the context (`className`), tabular numerals.
   * `hero`: the one big figure of a screen — serif display size, with the currency symbol
   * smaller and muted.
   */
  variant?: 'inline' | 'hero'
  className?: string
}

function isCurrencySpacing(
  part: Intl.NumberFormatPart,
  previous: Intl.NumberFormatPart | undefined,
  next: Intl.NumberFormatPart | undefined,
): boolean {
  return part.type === 'literal' && (previous?.type === 'currency' || next?.type === 'currency')
}

export function Amount({
  value,
  colorBySign = false,
  showPlus = false,
  compact = false,
  variant = 'inline',
  className,
}: AmountProps) {
  // Re-renders on language change; the locale itself is passed explicitly.
  const { locale } = useFormatters()
  const options = { locale, compact, signDisplay: showPlus ? 'exceptZero' : 'auto' } as const
  const signColor = cn(
    colorBySign && value > 0 && 'text-positive',
    colorBySign && value < 0 && 'text-negative',
  )

  if (variant === 'hero') {
    return (
      <span
        className={cn(
          'inline-block font-serif text-display-lg whitespace-nowrap sm:text-display-xl',
          signColor,
          className,
        )}
      >
        {formatMoneyParts(value, options).map((part, index, parts) =>
          part.type === 'currency' ? (
            <span
              key={index}
              className="mr-[0.08em] align-top text-[0.5em] leading-[1.6] text-ink-muted"
            >
              {part.value}
            </span>
          ) : (
            // The space between symbol and digits is replaced by the margin above.
            !isCurrencySpacing(part, parts[index - 1], parts[index + 1]) && (
              <span key={index}>{part.value}</span>
            )
          ),
        )}
      </span>
    )
  }

  return (
    <span className={cn('tabular-nums', signColor, className)}>{formatMoney(value, options)}</span>
  )
}
