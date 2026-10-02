import { Unlink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button, Field, Select } from '@/components/ui'
import {
  useFormatters,
  usePendingRecurringExpenses,
  usePeriods,
  useRecurringExpenses,
} from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { findPeriodForDateKey } from '@/lib/periodTiming'
import type { Category, RecurringExpense } from '@/types'

import { differenceFromEstimate, groupRecurringOptions } from '../lib/recurringLink'

export type LinkNotice =
  { kind: 'categorySet'; category: Category } | { kind: 'unlinkedByCategory'; name: string }

interface RecurringLinkFieldProps {
  /** Selected recurring expense id ('' = none). */
  value: string
  /** Current amount text, to compare with the estimate. */
  amount: string
  /** Movement date (`YYYY-MM-DD`): picks the period whose pending list is offered. */
  date: string
  /** The currently linked recurring expense, if any. */
  linked: RecurringExpense | undefined
  notice: LinkNotice | null
  onChange: (recurringExpenseId: string) => void
}

const FIELD_ID = 'transaction-recurring'

/**
 * "Cruzar con gasto fijo": native select grouped into the period's pending recurring
 * expenses (linkable) and the ones already registered (disabled — the mobile app only
 * offers pending ones). The period is the one the chosen date falls in, since that's
 * where the backend will file the movement.
 */
export function RecurringLinkField({
  value: recurringExpenseId,
  amount,
  date,
  linked,
  notice,
  onChange,
}: RecurringLinkFieldProps) {
  const { t } = useTranslation(['transactions', 'categories'])
  const { locale, money } = useFormatters()

  const { data: periods = [] } = usePeriods()
  const periodId = findPeriodForDateKey(periods, date)?.id
  const all = useRecurringExpenses()
  const pending = usePendingRecurringExpenses(periodId)
  const options = groupRecurringOptions(all.data ?? [], pending.data ?? [])
  const isLoading = all.isPending || (periodId !== undefined && pending.isPending)
  // A prefilled link stays selectable even if the lists disagree (e.g. still loading).
  const linkedIsListed = !linked || options.pending.some(item => item.id === linked.id)

  const difference = linked ? differenceFromEstimate(amount, linked.estimatedAmount, locale) : null

  const help = (
    <div className="space-y-0.5">
      {linked && (
        <p className="tabular-nums">
          {t('transactions:form.recurring.estimate', { amount: money(linked.estimatedAmount) })}
          {difference !== null && (
            <>
              {' · '}
              {t(
                difference > 0
                  ? 'transactions:form.recurring.over'
                  : 'transactions:form.recurring.under',
                { amount: money(Math.abs(difference)) },
              )}
            </>
          )}
        </p>
      )}
      {notice?.kind === 'categorySet' && (
        <p>
          {t('transactions:form.recurring.categorySet', {
            category: t(CATEGORY_META[notice.category].translationKey),
          })}
        </p>
      )}
      {notice?.kind === 'unlinkedByCategory' && (
        <p>{t('transactions:form.recurring.unlinkedByCategory', { name: notice.name })}</p>
      )}
      {!isLoading && options.pending.length === 0 && options.registered.length === 0 && (
        <p>{t('transactions:form.recurring.noActive')}</p>
      )}
    </div>
  )

  const optionLabel = (item: RecurringExpense) =>
    t('transactions:form.recurring.option', {
      name: item.name,
      amount: money(item.estimatedAmount),
      day: item.dayOfMonth,
    })

  return (
    <Field
      id={FIELD_ID}
      label={t('transactions:form.recurring.label')}
      hint={t('transactions:form.optional')}
      help={help}
    >
      <div className="flex items-center gap-2">
        <Select
          id={FIELD_ID}
          className="flex-1"
          value={recurringExpenseId}
          onChange={event => onChange(event.target.value)}
          aria-describedby={`${FIELD_ID}-help`}
          aria-busy={isLoading || undefined}
        >
          <option value="">
            {isLoading
              ? t('transactions:form.recurring.loading')
              : t('transactions:form.recurring.none')}
          </option>
          {!linkedIsListed && linked && <option value={linked.id}>{optionLabel(linked)}</option>}
          {options.pending.length > 0 && (
            <optgroup label={t('transactions:form.recurring.groupPending')}>
              {options.pending.map(item => (
                <option key={item.id} value={item.id}>
                  {optionLabel(item)}
                </option>
              ))}
            </optgroup>
          )}
          {options.registered.length > 0 && (
            <optgroup label={t('transactions:form.recurring.groupRegistered')}>
              {options.registered.map(item => (
                <option key={item.id} value={item.id} disabled={item.id !== recurringExpenseId}>
                  {t('transactions:form.recurring.registered', { name: item.name })}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
        {linked && (
          <Button variant="ghost" size="sm" icon={Unlink} onClick={() => onChange('')}>
            {t('transactions:form.recurring.unlink')}
          </Button>
        )}
      </div>
    </Field>
  )
}
