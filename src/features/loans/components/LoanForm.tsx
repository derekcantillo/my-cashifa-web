import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { DeleteConfirmation, errorProps, Field, inputClassName } from '@/components/ui'
import { useAccounts, useCreateLoan, useDeleteLoan, useFormatters, useUpdateLoan } from '@/hooks'
import { fromDateInputValue, parseAmountInput, toDateInputValue } from '@/lib/format'
import { loanPath, ROUTES } from '@/lib/routes'
import { useToastStore } from '@/store/toastStore'
import type { CreateLoanInput, Loan, UpdateLoanInput } from '@/types'

type ErrorCode =
  | 'borrowerRequired'
  | 'borrowerTooLong'
  | 'amountRequired'
  | 'amountInvalid'
  | 'amountPositive'
  | 'dateRequired'
  | 'noteTooLong'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function createSchema(locale: string, isEdit: boolean) {
  return z.object({
    borrowerName: z
      .string()
      .trim()
      .min(1, { error: 'borrowerRequired' })
      .max(120, { error: 'borrowerTooLong' }),
    // Amount, loan date and account are create-only (UpdateLoanDto doesn't accept them).
    amount: isEdit
      ? z.string()
      : z
          .string()
          .trim()
          .min(1, { error: 'amountRequired' })
          .refine(value => !Number.isNaN(parseAmountInput(value, locale)), {
            error: 'amountInvalid',
          })
          .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' }),
    loanDate: isEdit ? z.string() : z.string().regex(DATE_PATTERN, { error: 'dateRequired' }),
    dueDate: z.string().refine(value => value === '' || DATE_PATTERN.test(value), {
      error: 'dateRequired',
    }),
    note: z.string().trim().max(255, { error: 'noteTooLong' }),
    accountId: z.string(),
  })
}

type FormValues = z.infer<ReturnType<typeof createSchema>>

interface LoanFormProps {
  loan?: Loan
  onDone: () => void
}

export function LoanForm({ loan, onDone }: LoanFormProps) {
  const { t } = useTranslation(['loans', 'common'])
  const { locale, money } = useFormatters()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: accounts = [] } = useAccounts()
  const createLoan = useCreateLoan()
  const updateLoan = useUpdateLoan()
  const deleteLoan = useDeleteLoan()
  const pushToast = useToastStore(state => state.push)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const isEdit = loan !== undefined
  const schema = useMemo(() => createSchema(locale, isEdit), [locale, isEdit])
  // Same rule as the backend (and mobile): a loan with repayments keeps its history.
  const hasRepayments = (loan?.amountRepaid ?? 0) > 0

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      borrowerName: loan?.borrowerName ?? '',
      amount: '',
      loanDate: loan ? toDateInputValue(loan.loanDate) : toDateInputValue(),
      dueDate: loan?.dueDate ? toDateInputValue(loan.dueDate) : '',
      note: loan?.note ?? '',
      accountId: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    if (!loan) {
      const input: CreateLoanInput = {
        borrowerName: values.borrowerName,
        amount: parseAmountInput(values.amount, locale),
        loanDate: fromDateInputValue(values.loanDate),
        ...(values.dueDate ? { dueDate: fromDateInputValue(values.dueDate) } : {}),
        ...(values.note ? { note: values.note } : {}),
        ...(values.accountId ? { accountId: values.accountId } : {}),
      }
      await createLoan.mutateAsync(input)
      pushToast(t('toast.saved'))
    } else {
      const input: UpdateLoanInput = {
        ...(dirtyFields.borrowerName ? { borrowerName: values.borrowerName } : {}),
        // The backend can set a due date but not clear it, so an emptied field is ignored.
        ...(dirtyFields.dueDate && values.dueDate
          ? { dueDate: fromDateInputValue(values.dueDate) }
          : {}),
        ...(dirtyFields.note ? { note: values.note } : {}),
      }
      if (Object.keys(input).length > 0) {
        await updateLoan.mutateAsync({ id: loan.id, input })
        pushToast(t('toast.saved'))
      }
    }
    onDone()
  }

  const onDelete = async () => {
    if (!loan) return
    await deleteLoan.mutateAsync(loan.id)
    pushToast(t('toast.deleted'))
    onDone()
    if (location.pathname === loanPath(loan.id)) navigate(ROUTES.loans, { replace: true })
  }

  const errorText = (code: string | undefined) =>
    code ? t(`form.errors.${code as ErrorCode}`) : null
  const borrowerError = errorText(errors.borrowerName?.message)
  const amountError = errorText(errors.amount?.message)
  const loanDateError = errorText(errors.loanDate?.message)
  const dueDateError = errorText(errors.dueDate?.message)
  const noteError = errorText(errors.note?.message)
  const mutation = loan ? updateLoan : createLoan
  const isBusy = isSubmitting || deleteLoan.isPending

  return (
    <form
      noValidate
      onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
      className="space-y-5"
    >
      <Field id="loan-borrower" label={t('form.borrower')} error={borrowerError}>
        <input
          id="loan-borrower"
          type="text"
          autoComplete="off"
          placeholder={t('form.borrowerPlaceholder')}
          className={inputClassName(borrowerError)}
          {...errorProps('loan-borrower', borrowerError)}
          {...register('borrowerName')}
        />
      </Field>

      {loan ? (
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('form.amount')}</p>
          <p className="tabular-nums">{money(loan.amount)}</p>
          <p className="text-sm text-ink-muted">{t('form.amountFixed')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="loan-amount" label={t('form.amount')} error={amountError}>
            <input
              id="loan-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              className={inputClassName(amountError)}
              {...errorProps('loan-amount', amountError)}
              {...register('amount')}
            />
          </Field>
          <Field id="loan-date" label={t('form.loanDate')} error={loanDateError}>
            <input
              id="loan-date"
              type="date"
              className={inputClassName(loanDateError)}
              {...errorProps('loan-date', loanDateError)}
              {...register('loanDate')}
            />
          </Field>
        </div>
      )}

      <Field id="loan-due" label={t('form.dueDate')} hint={t('form.optional')} error={dueDateError}>
        <input
          id="loan-due"
          type="date"
          className={inputClassName(dueDateError)}
          {...errorProps('loan-due', dueDateError)}
          {...register('dueDate')}
        />
      </Field>

      {!loan && (
        <Field id="loan-account" label={t('form.account')} hint={t('form.optional')}>
          <select id="loan-account" className={inputClassName(null)} {...register('accountId')}>
            <option value="">{t('form.noAccount')}</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field id="loan-note" label={t('form.note')} hint={t('form.optional')} error={noteError}>
        <input
          id="loan-note"
          type="text"
          className={inputClassName(noteError)}
          {...errorProps('loan-note', noteError)}
          {...register('note')}
        />
      </Field>

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          {t('form.saveError')}
        </p>
      )}

      {confirmingDelete ? (
        <DeleteConfirmation
          title={t('form.deleteConfirm')}
          isPending={deleteLoan.isPending}
          error={deleteLoan.isError ? t('form.deleteError') : null}
          onConfirm={() => void onDelete().catch(() => undefined)}
          onCancel={() => setConfirmingDelete(false)}
        />
      ) : (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {loan && (
            <div className="flex items-center gap-3 sm:-ml-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={isBusy || hasRepayments}
                aria-describedby={hasRepayments ? 'loan-cant-delete' : undefined}
                className="shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:pointer-events-none disabled:opacity-40"
              >
                {t('common:common.delete')}
              </button>
              {hasRepayments && (
                <p id="loan-cant-delete" className="text-xs text-ink-muted">
                  {t('form.cantDelete')}
                </p>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={isBusy}
            className="shrink-0 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
          >
            {isSubmitting ? t('common:common.saving') : t('common:common.save')}
          </button>
        </div>
      )}
    </form>
  )
}
