import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { InlineError, Skeleton } from '@/components/ui'
import { useBudgetRules, useFormatters, useUpdateBudgetRules } from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'
import { CATEGORIES, type BudgetRule, type Category } from '@/types'

import { SettingsSection } from './SettingsSection'

type Draft = Record<Category, string>

function parsePercentage(value: string): number {
  const normalized = value.trim().replace(',', '.')
  return normalized === '' ? 0 : Number(normalized)
}

function isValidPercentage(value: string): boolean {
  const n = parsePercentage(value)
  return Number.isFinite(n) && n >= 0 && n <= 100 && /^\d*([.,]\d{0,2})?$/.test(value.trim())
}

export function BudgetRulesSection() {
  const { t } = useTranslation('settings')
  const { data, isPending, isError, refetch } = useBudgetRules()

  return (
    <SettingsSection id="rules-title" title={t('rules.title')} description={t('rules.description')}>
      {isError ? (
        <div className="py-4">
          <InlineError onRetry={() => void refetch()} />
        </div>
      ) : isPending ? (
        <div className="space-y-4 py-4" aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ) : (
        <BudgetRulesForm rules={data} />
      )}
    </SettingsSection>
  )
}

/** Local draft for every category; saved all together with one request. */
function BudgetRulesForm({ rules }: { rules: BudgetRule[] }) {
  const { t } = useTranslation(['settings', 'categories', 'common'])
  const { locale } = useFormatters()
  const updateRules = useUpdateBudgetRules()
  const pushToast = useToastStore(state => state.push)

  // Every category, not only those with a rule; missing ones start at 0.
  const [draft, setDraft] = useState<Draft>(() => {
    const byCategory = new Map(rules.map(rule => [rule.category, rule.targetPercentage]))
    return Object.fromEntries(
      CATEGORIES.map(category => [category, String(byCategory.get(category) ?? 0)]),
    ) as Draft
  })

  const allValid = CATEGORIES.every(category => isValidPercentage(draft[category]))
  const total = CATEGORIES.reduce(
    (sum, category) => sum + (parsePercentage(draft[category]) || 0),
    0,
  )
  const overLimit = total > 100
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!allValid) return
    // Not blocked above 100%: that's only a warning; the backend applies its own rules.
    updateRules.mutate(
      CATEGORIES.map(category => ({
        category,
        targetPercentage: parsePercentage(draft[category]),
      })),
      { onSuccess: () => pushToast(t('settings:rules.saved')) },
    )
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <ul className="divide-y divide-border">
        {CATEGORIES.map(category => {
          const meta = CATEGORY_META[category]
          const Icon = meta.icon
          const inputId = `rule-${category}`
          const invalid = !isValidPercentage(draft[category])
          return (
            <li key={category} className="flex items-center gap-3 py-2.5">
              <Icon className="size-4 shrink-0 text-ink-muted" aria-hidden />
              <label htmlFor={inputId} className="flex-1 text-sm">
                {t(meta.translationKey)}
              </label>
              {invalid && (
                <span id={`${inputId}-error`} className="text-xs text-danger">
                  {t('settings:rules.invalid')}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <input
                  id={inputId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft[category]}
                  onChange={event =>
                    setDraft(current => ({ ...current, [category]: event.target.value }))
                  }
                  aria-invalid={invalid || undefined}
                  aria-describedby={invalid ? `${inputId}-error` : undefined}
                  className={cn(
                    'w-16 rounded-lg border bg-transparent px-2 py-1.5 text-right text-sm tabular-nums outline-none transition focus:ring-2 focus:ring-brand/30',
                    invalid ? 'border-danger' : 'border-border focus:border-brand',
                  )}
                />
                <span className="text-sm text-ink-muted" aria-hidden>
                  %
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-4">
        <p
          aria-live="polite"
          className={cn('text-sm tabular-nums', overLimit ? 'text-danger' : 'text-ink-muted')}
        >
          {t('settings:rules.total', { total: percent.format(total / 100) })}
          {overLimit && <> · {t('settings:rules.over')}</>}
        </p>
        <button
          type="submit"
          disabled={!allValid || updateRules.isPending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateRules.isPending ? t('common:common.saving') : t('settings:rules.save')}
        </button>
      </div>
      {updateRules.isError && (
        <p role="alert" className="pb-4 text-sm text-danger">
          {t('settings:rules.saveError')}
        </p>
      )}
    </form>
  )
}
