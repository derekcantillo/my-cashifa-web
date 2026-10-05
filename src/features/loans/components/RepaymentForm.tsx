import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import {
  AmountField,
  Button,
  DateInput,
  errorProps,
  Field,
  ModalFooter,
  Textarea,
  useModalClose,
  useModalUnsavedChanges,
} from '@/components/ui'
import { useCreateLoanRepayment, useFormatters } from '@/hooks'
import { fromDateInputValue, parseAmountInput, toDateInputValue } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'
import type { Loan } from '@/types'

const FORM_ID = 'repayment-form'
const NOTE_MAX_LENGTH = 255

type ErrorCode =
  | 'amountRequired'
  | 'amountInvalid'
  | 'amountPositive'
  | 'amountTooHigh'
  | 'dateRequired'
  | 'dateFuture'
  | 'noteTooLong'

/**
 * POST /loans/:id/repayments takes `{amount, paidAt?, note?}` and does NOT check for
 * overpayment (the pending balance would go negative), so the amount is capped at
 * what's pending. `paidAt` follows the transaction convention (past day = noon Bogotá).
 */
function createSchema(locale: string, today: string, max: number) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, { error: 'amountRequired' })
      .refine(value => !Number.isNaN(parseAmountInput(value, locale)), { error: 'amountInvalid' })
      .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' })
      .refine(value => parseAmountInput(value, locale) <= max, { error: 'amountTooHigh' }),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'dateRequired' })
      .refine(value => value <= today, { error: 'dateFuture' }),
    note: z.string().trim().max(NOTE_MAX_LENGTH, { error: 'noteTooLong' }),
  })
}

type FormValues = z.infer<ReturnType<typeof createSchema>>

export function RepaymentForm({ loan, onDone }: { loan: Loan; onDone: () => void }) {
  const { t } = useTranslation('loans')
  const { locale, money } = useFormatters()
  const repay = useCreateLoanRepayment()
  const pushToast = useToastStore(state => state.push)
  const requestClose = useModalClose()
  const today = toDateInputValue()
  const max = loan.remainingAmount
  const schema = useMemo(() => createSchema(locale, today, max), [locale, today, max])

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', date: today, note: '' },
  })
  useModalUnsavedChanges(isDirty && !isSubmitting)

  const amountText = useWatch({ control, name: 'amount' })
  const amount = parseAmountInput(amountText, locale)
  const settles = !Number.isNaN(amount) && amount === max

  const onSubmit = async (values: FormValues) => {
    const updated = await repay.mutateAsync({
      id: loan.id,
      input: {
        amount: parseAmountInput(values.amount, locale),
        paidAt: fromDateInputValue(values.date),
        ...(values.note ? { note: values.note } : {}),
      },
    })
    pushToast(
      updated.status === 'PAID'
        ? t('toast.settled', { name: loan.borrowerName })
        : t('toast.repaid'),
    )
    onDone()
  }

  const errorText = (code: string | undefined) =>
    code ? t(`repayment.errors.${code as ErrorCode}`, { max: money(max) }) : null
  const amountError = errorText(errors.amount?.message)
  const dateError = errorText(errors.date?.message)
  const noteError = errorText(errors.note?.message)

  return (
    <>
      <form
        id={FORM_ID}
        noValidate
        onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <p className="text-body-sm font-medium text-ink">{t('repayment.loan')}</p>
          <p className="rounded-sm bg-surface-sunken px-3 py-2.5 text-body text-ink">
            {loan.borrowerName}
          </p>
        </div>

        <Field
          id="repayment-amount"
          label={t('repayment.amount')}
          error={amountError}
          help={
            <span className="tabular-nums">
              {settles ? t('repayment.settles') : t('repayment.remaining', { amount: money(max) })}
            </span>
          }
        >
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <AmountField
                id="repayment-amount"
                ref={field.ref}
                name={field.name}
                size="lg"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                invalid={Boolean(amountError)}
                data-autofocus
                {...errorProps('repayment-amount', amountError, true)}
              />
            )}
          />
        </Field>

        <Field id="repayment-date" label={t('repayment.date')} error={dateError}>
          <DateInput
            id="repayment-date"
            max={today}
            invalid={Boolean(dateError)}
            {...errorProps('repayment-date', dateError)}
            {...register('date')}
          />
        </Field>

        <Field
          id="repayment-note"
          label={t('repayment.note')}
          hint={t('repayment.optional')}
          error={noteError}
        >
          <Textarea
            id="repayment-note"
            rows={2}
            maxLength={NOTE_MAX_LENGTH}
            invalid={Boolean(noteError)}
            {...errorProps('repayment-note', noteError)}
            {...register('note')}
          />
        </Field>

        <p className="text-body-sm text-ink-muted">{t('repayment.help')}</p>

        {repay.isError && (
          <p
            role="alert"
            className="rounded-sm bg-negative-soft px-3 py-2.5 text-body-sm text-negative"
          >
            {t('repayment.saveError')}
          </p>
        )}
      </form>

      <ModalFooter>
        <Button variant="ghost" className="ml-auto" onClick={requestClose} disabled={isSubmitting}>
          {t('repayment.cancel')}
        </Button>
        <Button type="submit" form={FORM_ID} loading={isSubmitting}>
          {t('repayment.save')}
        </Button>
      </ModalFooter>
    </>
  )
}
