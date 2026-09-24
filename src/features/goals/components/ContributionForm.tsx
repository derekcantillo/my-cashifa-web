import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { errorProps, Field, inputClassName } from '@/components/ui'
import { useCreateGoalContribution, useFormatters } from '@/hooks'
import { fromDateInputValue, parseAmountInput, toDateInputValue } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'

type ErrorCode = 'amountRequired' | 'amountInvalid' | 'amountPositive' | 'dateRequired'

function createSchema(locale: string) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, { error: 'amountRequired' })
      .refine(value => !Number.isNaN(parseAmountInput(value, locale)), { error: 'amountInvalid' })
      .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'dateRequired' }),
    note: z.string().trim().max(255),
  })
}

type FormValues = z.infer<ReturnType<typeof createSchema>>

interface ContributionFormProps {
  goalId: string
  onDone: () => void
}

/** Inline panel under the hero. Past dates are allowed (`contributedAt` is retroactive). */
export function ContributionForm({ goalId, onDone }: ContributionFormProps) {
  const { t } = useTranslation(['goals', 'common'])
  const { locale } = useFormatters()
  const contribute = useCreateGoalContribution()
  const pushToast = useToastStore(state => state.push)
  const schema = useMemo(() => createSchema(locale), [locale])
  const today = toDateInputValue()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', date: today, note: '' },
  })

  const onSubmit = async (values: FormValues) => {
    await contribute.mutateAsync({
      id: goalId,
      input: {
        amount: parseAmountInput(values.amount, locale),
        contributedAt: fromDateInputValue(values.date),
        ...(values.note ? { note: values.note } : {}),
      },
    })
    pushToast(t('toast.contributed'))
    onDone()
  }

  const errorText = (code: string | undefined) =>
    code ? t(`form.errors.${code as ErrorCode}`) : null
  const amountError = errorText(errors.amount?.message)
  const dateError = errorText(errors.date?.message)

  return (
    <form
      noValidate
      onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
      className="space-y-4 rounded-2xl border border-border bg-surface-elevated p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contribution-amount" label={t('contribution.amount')} error={amountError}>
          <input
            id="contribution-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- the panel opens on explicit request; start typing right away
            autoFocus
            className={inputClassName(amountError)}
            {...errorProps('contribution-amount', amountError)}
            {...register('amount')}
          />
        </Field>
        <Field id="contribution-date" label={t('contribution.date')} error={dateError}>
          <input
            id="contribution-date"
            type="date"
            max={today}
            className={inputClassName(dateError)}
            {...errorProps('contribution-date', dateError)}
            {...register('date')}
          />
        </Field>
      </div>
      <Field
        id="contribution-note"
        label={t('contribution.note')}
        hint={t('contribution.optional')}
      >
        <input
          id="contribution-note"
          type="text"
          maxLength={255}
          className={inputClassName(null)}
          {...register('note')}
        />
      </Field>

      {contribute.isError && (
        <p role="alert" className="text-sm text-danger">
          {t('contribution.saveError')}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={isSubmitting}
          className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-60"
        >
          {t('contribution.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {isSubmitting ? t('common:common.saving') : t('contribution.save')}
        </button>
      </div>
    </form>
  )
}
