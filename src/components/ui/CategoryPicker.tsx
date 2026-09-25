import type { UseFormRegisterReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { CATEGORY_META } from '@/lib/categoryMeta'
import { CATEGORIES } from '@/types'

import { FieldError } from './FormField'

interface CategoryPickerProps {
  /** Unique per form, used for the error id. */
  id: string
  legend: string
  /** `register('category')` from react-hook-form — each option is a native radio. */
  registration: UseFormRegisterReturn
  error?: string | null
}

/**
 * Grid of every category (icon + i18n label) as native radio buttons: arrow keys,
 * form reset and validation all come from the browser and react-hook-form.
 */
export function CategoryPicker({ id, legend, registration, error }: CategoryPickerProps) {
  const { t } = useTranslation(['categories'])
  const errorId = `${id}-error`

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {CATEGORIES.map(category => {
          const meta = CATEGORY_META[category]
          const Icon = meta.icon
          return (
            <label
              key={category}
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-border px-1 py-2.5 text-center text-xs text-ink-muted transition-colors hover:text-ink has-checked:border-brand has-checked:bg-brand/10 has-checked:text-brand has-focus-visible:ring-2 has-focus-visible:ring-brand"
            >
              <input type="radio" value={category} className="sr-only" {...registration} />
              <Icon className="size-5" aria-hidden />
              <span className="leading-tight">{t(meta.translationKey)}</span>
            </label>
          )
        })}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  )
}
