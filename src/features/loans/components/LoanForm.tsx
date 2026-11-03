import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import {
  AmountField,
  Button,
  DateInput,
  errorProps,
  Field,
  Input,
  ModalFooter,
  Select,
  Textarea,
  useModalClose,
  useModalUnsavedChanges,
} from '@/components/ui'
import { useAccounts, useCreateLoan, useFormatters, useLoan, useUpdateLoan } from '@/hooks'
import {
  formatAmountInput,
  fromDateInputValue,
  parseAmountInput,
  toDateInputValue,
} from '@/lib/format'
import { loanPath, ROUTES } from '@/lib/routes'
import { useToastStore } from '@/store/toastStore'
import type { CreateLoanInput, Loan, LoanRepayment, UpdateLoanInput } from '@/types'

import { firstRepayment, loanAmountError, loanDateAfterFirstRepayment } from '../lib/loanEdit'

const FORM_ID = 'loan-form'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
/** CreateLoanDto: `borrowerName` ≤ 120, `note` ≤ 255. */
const NAME_MAX_LENGTH = 120
const NOTE_MAX_LENGTH = 255

type ErrorCode =
  | 'borrowerRequired'
  | 'borrowerTooLong'
  | 'amountRequired'
  | 'amountInvalid'
  | 'amountPositive'
  | 'dateRequired'
  | 'dateFuture'
  | 'dueBeforeLoan'
  | 'noteTooLong'
  | 'amountBelowRepaid'
  | 'dateAfterRepayment'

/** Edit mode: what the loan's repayments allow. */
interface RepaymentLimits {
  amountRepaid: number
  /** Unknown while the loan detail loads; the backend still checks it (400). */
  first: Pick<LoanRepayment, 'paidAt'> | undefined
}

/**
 * Borrower, amount, loan date (required by CreateLoanDto), optional due date, note and
 * account. Editing takes the same fields (UpdateLoanDto): the amount can't go below
 * what was already repaid, and the loan date can't move past the first repayment.
 */
function createSchema(locale: string, today: string, limits: RepaymentLimits | undefined) {
  return z
    .object({
      borrowerName: z
        .string()
        .trim()
        .min(1, { error: 'borrowerRequired' })
        .max(NAME_MAX_LENGTH, { error: 'borrowerTooLong' }),
      amount: z
        .string()
        .trim()
        .min(1, { error: 'amountRequired' })
        .refine(value => !Number.isNaN(parseAmountInput(value, locale)), {
          error: 'amountInvalid',
        })
        .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' })
        .refine(
          value =>
            loanAmountError(parseAmountInput(value, locale), limits?.amountRepaid ?? 0) !==
            'amountBelowRepaid',
          { error: 'amountBelowRepaid' },
        ),
      loanDate: z
        .string()
        .regex(DATE_PATTERN, { error: 'dateRequired' })
        .refine(value => value <= today, { error: 'dateFuture' })
        .refine(value => !loanDateAfterFirstRepayment(value, limits?.first), {
          error: 'dateAfterRepayment',
        }),
      dueDate: z.string().refine(value => value === '' || DATE_PATTERN.test(value), {
        error: 'dateRequired',
      }),
      note: z.string().trim().max(NOTE_MAX_LENGTH, { error: 'noteTooLong' }),
      accountId: z.string(),
    })
    .superRefine((values, context) => {
      if (values.dueDate && values.loanDate && values.dueDate < values.loanDate) {
        context.addIssue({ code: 'custom', path: ['dueDate'], message: 'dueBeforeLoan' })
      }
    })
}

type FormValues = z.infer<ReturnType<typeof createSchema>>

interface LoanFormProps {
  loan?: Loan
  onDone: () => void
}

/** Inside the loan Modal: its actions go to the pinned footer. */
export function LoanForm({ loan, onDone }: LoanFormProps) {
  const { t } = useTranslation('loans')
  const { locale, money, shortDate } = useFormatters()
  const { data: accounts = [] } = useAccounts()
  // The list entry has no repayments; the detail is usually cached by the panel.
  const { data: detail } = useLoan(loan?.id)
  const createLoan = useCreateLoan()
  const updateLoan = useUpdateLoan()
  const pushToast = useToastStore(state => state.push)
  const requestClose = useModalClose()
  const navigate = useNavigate()
  const location = useLocation()
  const today = toDateInputValue()
  const isEdit = loan !== undefined
  const first = detail ? firstRepayment(detail.repayments) : undefined
  const amountRepaid = loan?.amountRepaid
  const schema = useMemo(
    () =>
      createSchema(locale, today, amountRepaid === undefined ? undefined : { amountRepaid, first }),
    [locale, today, amountRepaid, first],
  )

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      borrowerName: loan?.borrowerName ?? '',
      amount: loan ? formatAmountInput(loan.amount, locale) : '',
      loanDate: loan ? toDateInputValue(loan.loanDate) : today,
      dueDate: loan?.dueDate ? toDateInputValue(loan.dueDate) : '',
      note: loan?.note ?? '',
      accountId: loan?.accountId ?? '',
    },
  })
  useModalUnsavedChanges(isDirty && !isSubmitting)

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
      const created = await createLoan.mutateAsync(input)
      pushToast(t('toast.saved'))
      if (location.pathname === ROUTES.loans) navigate(loanPath(created.id))
    } else {
      const input: UpdateLoanInput = {
        ...(dirtyFields.borrowerName ? { borrowerName: values.borrowerName } : {}),
        ...(dirtyFields.amount ? { amount: parseAmountInput(values.amount, locale) } : {}),
        ...(dirtyFields.loanDate ? { loanDate: fromDateInputValue(values.loanDate) } : {}),
        ...(dirtyFields.accountId ? { accountId: values.accountId || null } : {}),
        // The backend can set a due date but not clear it: an emptied field is ignored.
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

  // Only some messages interpolate; the others ignore the values.
  const errorText = (code: string | undefined) =>
    code
      ? t(`form.errors.${code as ErrorCode}`, {
          amount: amountRepaid === undefined ? '' : money(amountRepaid),
          date: first ? shortDate(first.paidAt) : '',
        })
      : null
  const borrowerError = errorText(errors.borrowerName?.message)
  const amountError = errorText(errors.amount?.message)
  const loanDateError = errorText(errors.loanDate?.message)
  const dueDateError = errorText(errors.dueDate?.message)
  const noteError = errorText(errors.note?.message)
  const mutation = loan ? updateLoan : createLoan

  return (
    <>
      <form
        id={FORM_ID}
        noValidate
        onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
        className="space-y-5"
      >
        <Field id="loan-borrower" label={t('form.borrower')} error={borrowerError}>
          <Input
            id="loan-borrower"
            autoComplete="off"
            maxLength={NAME_MAX_LENGTH}
            placeholder={t('form.borrowerPlaceholder')}
            invalid={Boolean(borrowerError)}
            data-autofocus
            {...errorProps('loan-borrower', borrowerError)}
            {...register('borrowerName')}
          />
        </Field>

        <Field
          id="loan-amount"
          label={t('form.amount')}
          help={
            loan && loan.amountRepaid > 0
              ? t('form.amountRepaidHelp', { amount: money(loan.amountRepaid) })
              : undefined
          }
          error={amountError}
        >
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <AmountField
                id="loan-amount"
                ref={field.ref}
                name={field.name}
                size="lg"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                invalid={Boolean(amountError)}
                {...errorProps('loan-amount', amountError, Boolean(loan && loan.amountRepaid > 0))}
              />
            )}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="loan-date" label={t('form.loanDate')} error={loanDateError}>
            <DateInput
              id="loan-date"
              max={first ? toDateInputValue(first.paidAt) : today}
              invalid={Boolean(loanDateError)}
              {...errorProps('loan-date', loanDateError)}
              {...register('loanDate')}
            />
          </Field>
          <Field
            id="loan-due"
            label={t('form.dueDate')}
            hint={t('form.optional')}
            help={isEdit && loan.dueDate ? t('form.dueDateHelp') : undefined}
            error={dueDateError}
          >
            <DateInput
              id="loan-due"
              invalid={Boolean(dueDateError)}
              {...errorProps('loan-due', dueDateError, Boolean(isEdit && loan.dueDate))}
              {...register('dueDate')}
            />
          </Field>
          <Field
            id="loan-account"
            label={t('form.account')}
            hint={t('form.optional')}
            help={isEdit ? t('form.accountEditHelp') : undefined}
          >
            <Select
              id="loan-account"
              aria-describedby={isEdit ? 'loan-account-help' : undefined}
              {...register('accountId')}
            >
              <option value="">{t('form.noAccount')}</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field id="loan-note" label={t('form.note')} hint={t('form.optional')} error={noteError}>
          <Textarea
            id="loan-note"
            rows={2}
            maxLength={NOTE_MAX_LENGTH}
            invalid={Boolean(noteError)}
            {...errorProps('loan-note', noteError)}
            {...register('note')}
          />
        </Field>

        {!isEdit && <p className="text-body-sm text-ink-muted">{t('form.createHelp')}</p>}

        {mutation.isError && (
          <p
            role="alert"
            className="rounded-sm bg-negative-soft px-3 py-2.5 text-body-sm text-negative"
          >
            {t('form.saveError')}
          </p>
        )}
      </form>

      <ModalFooter>
        <Button variant="ghost" className="ml-auto" onClick={requestClose} disabled={isSubmitting}>
          {t('form.cancel')}
        </Button>
        <Button type="submit" form={FORM_ID} loading={isSubmitting}>
          {t('form.save')}
        </Button>
      </ModalFooter>
    </>
  )
}
