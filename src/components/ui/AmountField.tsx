import { forwardRef, useLayoutEffect, useRef, type InputHTMLAttributes } from 'react'

import { useFormatters } from '@/hooks'
import { cn } from '@/lib/cn'
import { caretAfterTyping, currencySymbol, formatAmountTyping } from '@/lib/format'

import { fieldBaseClassName } from './Input'

interface AmountFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'size'
> {
  /** The formatted text ("1.450.000"); convert it with `parseAmountInput`. */
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  /** `lg`: the protagonist of the transaction modal (36px). `md`: inline forms. */
  size?: 'md' | 'lg'
}

/**
 * Money input: currency symbol on the left, thousands separators added while typing
 * (per the active language), positive only, `inputMode="decimal"`. Controlled: use it
 * through react-hook-form's `Controller`.
 */
export const AmountField = forwardRef<HTMLInputElement, AmountFieldProps>(function AmountField(
  { value, onChange, invalid = false, size = 'md', className, ...props },
  forwardedRef,
) {
  const { locale } = useFormatters()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pendingCaret = useRef<number | null>(null)

  // Restore the caret after React writes the reformatted value.
  useLayoutEffect(() => {
    if (pendingCaret.current === null || !inputRef.current) return
    inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current)
    pendingCaret.current = null
  }, [value])

  const large = size === 'lg'

  return (
    <div className={cn('relative', className)}>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-muted',
          large ? 'left-4 text-title font-normal' : 'left-3 text-body',
        )}
      >
        {currencySymbol(locale)}
      </span>
      <input
        ref={node => {
          inputRef.current = node
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node
        }}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        value={value}
        onChange={event => {
          const raw = event.target.value
          const formatted = formatAmountTyping(raw, locale)
          pendingCaret.current = caretAfterTyping(
            raw,
            event.target.selectionStart ?? raw.length,
            formatted,
            locale,
          )
          onChange(formatted)
        }}
        className={cn(
          fieldBaseClassName(invalid),
          'tabular-nums',
          large ? 'h-16 pr-4 pl-9 text-amount-input' : 'h-10 pr-3 pl-7',
        )}
        {...props}
      />
    </div>
  )
})
