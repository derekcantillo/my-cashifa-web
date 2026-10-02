import type { UseFormRegisterReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { CATEGORIES, type Category } from '@/types'

import { FieldError } from './FormField'

interface CategoryPickerProps {
  /** Unique per form, used for the error id. */
  id: string
  legend: string
  /** `register('category')` from react-hook-form — each option is a native radio. */
  registration: UseFormRegisterReturn
  /** Which categories to offer (default: all of them), in this order. */
  categories?: readonly Category[]
  error?: string | null
  /** Help text under the grid (e.g. why the category is linked to something). */
  help?: string | null
  className?: string
}

/**
 * Grid of categories as native radio buttons: the fieldset is a radio group, arrow
 * keys move the selection, and form reset/validation come from the browser and
 * react-hook-form. One color for every category: selected = accent border, accent-soft
 * fill and accent icon.
 */
export function CategoryPicker({
  id,
  legend,
  registration,
  categories = CATEGORIES,
  error,
  help,
  className,
}: CategoryPickerProps) {
  const { t } = useTranslation(['categories'])
  const errorId = `${id}-error`
  const helpId = `${id}-help`

  return (
    <fieldset
      aria-describedby={
        [error ? errorId : null, help ? helpId : null].filter(Boolean).join(' ') || undefined
      }
      aria-invalid={error ? true : undefined}
      className={className}
    >
      <legend className="mb-2 text-body-sm font-medium text-ink">{legend}</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {categories.map(category => {
          const meta = CATEGORY_META[category]
          const Icon = meta.icon
          return (
            <label
              key={category}
              className={cn(
                'group flex min-h-[68px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-sm border px-1 py-2.5 text-center',
                'border-line bg-surface-raised text-body-sm text-ink-muted transition-tactile',
                'hover:bg-surface-sunken hover:text-ink',
                'has-checked:border-accent has-checked:bg-accent-soft has-checked:text-ink',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
                'has-disabled:cursor-not-allowed has-disabled:opacity-50',
              )}
            >
              <input type="radio" value={category} className="sr-only" {...registration} />
              <Icon
                className="size-[18px] text-ink-muted transition-tactile group-has-checked:text-accent"
                aria-hidden
              />
              <span className="leading-tight">{t(meta.translationKey)}</span>
            </label>
          )
        })}
      </div>
      {help && !error && (
        <p id={helpId} className="mt-2 text-body-sm text-ink-muted">
          {help}
        </p>
      )}
      {error && (
        <div className="mt-2">
          <FieldError id={errorId}>{error}</FieldError>
        </div>
      )}
    </fieldset>
  )
}
