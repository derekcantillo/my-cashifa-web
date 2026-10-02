import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { useFormatters } from '@/hooks'
import { fromDateInputValue, parseAmountInput, toDateInputValue } from '@/lib/format'

import { AmountField } from './AmountField'
import { Button } from './Button'
import { errorProps, Field } from './FormField'
import { DateInput, Input } from './Input'

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
    control,
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
      className="space-y-4 rounded-lg bg-surface-raised p-5 shadow-raised"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={ids.amount} label={t('amountForm.amount')} error={amountError}>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <AmountField
                id={ids.amount}
                ref={field.ref}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                invalid={Boolean(amountError)}
                // eslint-disable-next-line jsx-a11y/no-autofocus -- the panel opens on explicit request; start typing right away
                autoFocus
                {...errorProps(ids.amount, amountError)}
              />
            )}
          />
        </Field>
        <Field id={ids.date} label={t('amountForm.date')} error={dateError}>
          <DateInput
            id={ids.date}
            max={today}
            invalid={Boolean(dateError)}
            {...errorProps(ids.date, dateError)}
            {...register('date')}
          />
        </Field>
      </div>
      <Field id={ids.note} label={t('amountForm.note')} hint={t('amountForm.optional')}>
        <Input id={ids.note} maxLength={255} {...register('note')} />
      </Field>

      {errorMessage && (
        <p role="alert" className="text-body-sm text-negative">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          {t('amountForm.cancel')}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
