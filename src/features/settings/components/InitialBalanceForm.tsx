import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { errorProps, Field, inputClassName } from '@/components/ui'
import { useFormatters, useSetInitialBalance } from '@/hooks'
import { fromDateInputValue, parseSignedAmountInput, toDateInputValue } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'

type ErrorCode = 'amountRequired' | 'amountInvalid' | 'dateRequired'

interface InitialBalanceFormProps {
  accountId: string
  onDone: () => void
}

/**
 * "Ponerse al día": the balance as of a date. The backend computes
 * `currentBalance = initialBalance + movements since that date`.
 */
export function InitialBalanceForm({ accountId, onDone }: InitialBalanceFormProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { locale } = useFormatters()
  const setInitialBalance = useSetInitialBalance()
  const pushToast = useToastStore(state => state.push)
  const today = toDateInputValue()

  const schema = useMemo(
    () =>
      z.object({
        amount: z
          .string()
          .trim()
          .min(1, { error: 'amountRequired' })
          .refine(value => !Number.isNaN(parseSignedAmountInput(value, locale)), {
            error: 'amountInvalid',
          }),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'dateRequired' }),
      }),
    [locale],
  )
  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', date: today },
  })

  const onSubmit = async (values: FormValues) => {
    await setInitialBalance.mutateAsync({
      id: accountId,
      input: {
        amount: parseSignedAmountInput(values.amount, locale),
        date: fromDateInputValue(values.date),
      },
    })
    pushToast(t('accounts.balanceUpdated'))
    onDone()
  }

  const errorText = (code: string | undefined) =>
    code ? t(`accounts.errors.${code as ErrorCode}`) : null
  const amountError = errorText(errors.amount?.message)
  const dateError = errorText(errors.date?.message)
  const ids = { amount: `balance-${accountId}`, date: `balance-date-${accountId}` }

  return (
    <form
      noValidate
      onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
      className="mb-4 space-y-4 rounded-xl bg-surface p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={ids.amount} label={t('accounts.newInitialBalance')} error={amountError}>
          <input
            id={ids.amount}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- the panel opens on explicit request
            autoFocus
            className={inputClassName(amountError)}
            {...errorProps(ids.amount, amountError)}
            {...register('amount')}
          />
        </Field>
        <Field id={ids.date} label={t('accounts.since')} error={dateError}>
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
      <p className="text-sm text-ink-muted">{t('accounts.balanceHint')}</p>
      {setInitialBalance.isError && (
        <p role="alert" className="text-sm text-danger">
          {t('accounts.updateError')}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={isSubmitting}
          className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-60"
        >
          {t('accounts.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {isSubmitting ? t('common:common.saving') : t('accounts.save')}
        </button>
      </div>
    </form>
  )
}
