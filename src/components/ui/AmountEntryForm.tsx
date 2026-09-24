import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { useFormatters } from '@/hooks'
import { fromDateInputValue, parseAmountInput, toDateInputValue } from '@/lib/format'

import { errorProps, Field, inputClassName } from './FormField'

type ErrorCode =
  'amountRequired' | 'amountInvalid' | 'amountPositive' | 'amountTooHigh' | 'dateRequired'

export interface AmountEntry {
  amount: number
  /** ISO instant (today = now, other days = noon Bogotá). */
  date: string
  note?: string
}

interface AmountEntryFormProps {
  /** Prefix for input ids, so two forms on a page never collide. */
  idPrefix: string
  submitLabel: string
  /** Upper bound for the amount (e.g. what's still owed). */
  maxAmount?: number
  /** Shown when the save request failed. */
  errorMessage?: string | null
  onSubmit: (entry: AmountEntry) => Promise<unknown>
  onCancel: () => void
}

/**
 * Inline panel for "add an amount on a date, with an optional note" — goal
 * contributions and loan repayments. Past dates are allowed; future ones aren't.
 */
export function AmountEntryForm({
  idPrefix,
  submitLabel,
  maxAmount,
  errorMessage,
  onSubmit,
  onCancel,
}: AmountEntryFormProps) {
  const { t } = useTranslation()
  const { locale, money } = useFormatters()
  const today = toDateInputValue()

  const schema = useMemo(
    () =>
      z.object({
        amount: z
          .string()
          .trim()
          .min(1, { error: 'amountRequired' })
          .refine(value => !Number.isNaN(parseAmountInput(value, locale)), {
            error: 'amountInvalid',
          })
          .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' })
          .refine(
            value => maxAmount === undefined || parseAmountInput(value, locale) <= maxAmount,
            { error: 'amountTooHigh' },
          ),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'dateRequired' }),
        note: z.string().trim().max(255),
      }),
    [locale, maxAmount],
  )
  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', date: today, note: '' },
  })

  const submit = async (values: FormValues) => {
    await onSubmit({
      amount: parseAmountInput(values.amount, locale),
      date: fromDateInputValue(values.date),
      ...(values.note ? { note: values.note } : {}),
    })
  }

  const errorText = (code: string | undefined) =>
    code
      ? t(`amountForm.errors.${code as ErrorCode}`, {
          max: maxAmount === undefined ? '' : money(maxAmount),
        })
      : null
  const amountError = errorText(errors.amount?.message)
  const dateError = errorText(errors.date?.message)
  const ids = { amount: `${idPrefix}-amount`, date: `${idPrefix}-date`, note: `${idPrefix}-note` }

  return (
    <form
      noValidate
      onSubmit={event => void handleSubmit(submit)(event).catch(() => undefined)}
      className="space-y-4 rounded-2xl border border-border bg-surface-elevated p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={ids.amount} label={t('amountForm.amount')} error={amountError}>
          <input
            id={ids.amount}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- the panel opens on explicit request; start typing right away
            autoFocus
            className={inputClassName(amountError)}
            {...errorProps(ids.amount, amountError)}
            {...register('amount')}
          />
        </Field>
        <Field id={ids.date} label={t('amountForm.date')} error={dateError}>
          <input
            id={ids.date}
            type="date"
            max={today}
            className={inputClassName(dateError)}
            {...errorProps(ids.date, dateError)}
            {...register('date')}
          />
        </Field>
      </div>
      <Field id={ids.note} label={t('amountForm.note')} hint={t('amountForm.optional')}>
        <input
          id={ids.note}
          type="text"
          maxLength={255}
          className={inputClassName(null)}
          {...register('note')}
        />
      </Field>

      {errorMessage && (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-60"
        >
          {t('amountForm.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {isSubmitting ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  )
}
