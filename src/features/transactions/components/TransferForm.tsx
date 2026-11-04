import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  AmountField,
  Button,
  ConfirmDeleteDialog,
  DateInput,
  errorProps,
  Field,
  ModalFooter,
  SectionError,
  Select,
  Skeleton,
  Textarea,
  useModalClose,
  useModalUnsavedChanges,
} from '@/components/ui'
import {
  useAccounts,
  useApiErrorMessages,
  useCreateTransaction,
  useDeleteTransaction,
  useFormatters,
  useUpdateTransaction,
} from '@/hooks'
import { apiErrorMessage } from '@/lib/apiError'
import { formatAmountInput } from '@/lib/format'
import { ROUTES } from '@/lib/routes'
import { isCardPayment } from '@/lib/transfers'
import { useToastStore } from '@/store/toastStore'
import type { Account, Transaction } from '@/types'

import {
  createTransferSchema,
  toCreateTransferInput,
  toUpdateTransferInput,
  TRANSFER_NOTE_MAX_LENGTH,
  transferDefaults,
  transferValuesOf,
  type TransferErrorCode,
  type TransferFormValues,
  type TransferPreset,
} from '../lib/transferForm'

export const TRANSFER_FORM_ID = 'transfer-form'

interface TransferFormProps {
  /** Present in edit mode. */
  transaction?: Transaction
  /** Create mode: preselected destination ("Pagar tarjeta"). */
  preset?: TransferPreset
  onDone: () => void
}

/**
 * Money between two of the user's own accounts: origin, destination, amount, date and
 * note. No type or category: a transfer can't become another kind of movement (the
 * backend rejects it), so editing one keeps it a transfer. Waits for the accounts, which
 * pick the starting origin and destination.
 */
export function TransferForm(props: TransferFormProps) {
  const { t } = useTranslation('transactions')
  const requestClose = useModalClose()
  const accounts = useAccounts()

  if (accounts.isError) {
    return <SectionError onRetry={() => void accounts.refetch()} />
  }
  if (accounts.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }
  // A transfer needs two accounts; with fewer there's nothing to pick.
  if (!props.transaction && accounts.data.length < 2) {
    return (
      <>
        <p className="rounded-sm bg-surface-sunken px-3 py-2.5 text-body-sm text-ink-muted">
          {t('transfer.needsTwoAccounts')}{' '}
          <Link
            to={ROUTES.settings}
            onClick={requestClose}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('transfer.goToSettings')}
          </Link>
        </p>
        <ModalFooter>
          <Button variant="secondary" className="ml-auto" onClick={requestClose}>
            {t('form.close')}
          </Button>
        </ModalFooter>
      </>
    )
  }
  return <TransferFormFields {...props} accounts={accounts.data} />
}

function TransferFormFields({
  transaction,
  preset,
  onDone,
  accounts,
}: TransferFormProps & { accounts: readonly Account[] }) {
  const { t } = useTranslation('transactions')
  const { locale, money } = useFormatters()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const pushToast = useToastStore(state => state.push)
  const requestClose = useModalClose()
  const apiErrorMessages = useApiErrorMessages()
  const schema = useMemo(() => createTransferSchema(locale), [locale])
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: transaction
      ? transferValuesOf(transaction, formatAmountInput(transaction.amount, locale))
      : transferDefaults(accounts, preset),
  })

  useModalUnsavedChanges(isDirty && !isSubmitting)
  const description = useWatch({ control, name: 'description' })

  const onSubmit = async (values: TransferFormValues) => {
    if (!transaction) {
      await createTransaction.mutateAsync(toCreateTransferInput(values, locale))
      pushToast(t('toast.transferSaved'))
    } else {
      const input = toUpdateTransferInput(values, dirtyFields, locale)
      if (Object.keys(input).length > 0) {
        await updateTransaction.mutateAsync({ id: transaction.id, input })
        pushToast(t('toast.transferSaved'))
      }
    }
    onDone()
  }

  const onDelete = () => {
    if (!transaction) return
    deleteTransaction.mutate(transaction.id, {
      onSuccess: () => {
        pushToast(t('toast.deleted'))
        onDone()
      },
    })
  }

  const errorText = (code: string | undefined) =>
    code ? t(`transfer.errors.${code as TransferErrorCode}`) : null
  const originError = errorText(errors.accountId?.message)
  const destinationError = errorText(errors.toAccountId?.message)
  const amountError = errorText(errors.amount?.message)
  const dateError = errorText(errors.date?.message)
  const noteError = errorText(errors.description?.message)
  const saveError = apiErrorMessage(createTransaction.error ?? updateTransaction.error, {
    ...apiErrorMessages,
    unknown: t('form.saveError'),
  })
  const deleteError = apiErrorMessage(deleteTransaction.error, {
    ...apiErrorMessages,
    unknown: t('form.deleteError'),
  })

  const accountOptions = (
    <>
      <option value="">{t('transfer.pickAccount')}</option>
      {accounts.map(account => (
        <option key={account.id} value={account.id}>
          {account.name}
        </option>
      ))}
    </>
  )

  return (
    <>
      <form
        id={TRANSFER_FORM_ID}
        noValidate
        onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
        className="space-y-6"
      >
        <p className="text-body-sm text-ink-muted">{t('transfer.explanation')}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="transfer-origin" label={t('transfer.origin')} error={originError}>
            <Select
              id="transfer-origin"
              invalid={Boolean(originError)}
              {...errorProps('transfer-origin', originError)}
              {...register('accountId', { deps: ['toAccountId'] })}
            >
              {accountOptions}
            </Select>
          </Field>
          <Field
            id="transfer-destination"
            label={t('transfer.destination')}
            error={destinationError}
          >
            <Select
              id="transfer-destination"
              invalid={Boolean(destinationError)}
              {...errorProps('transfer-destination', destinationError)}
              {...register('toAccountId')}
            >
              {accountOptions}
            </Select>
          </Field>
        </div>

        <Field id="transfer-amount" label={t('form.amount')} error={amountError}>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <AmountField
                id="transfer-amount"
                ref={field.ref}
                name={field.name}
                size="lg"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                invalid={Boolean(amountError)}
                data-autofocus
                {...errorProps('transfer-amount', amountError)}
              />
            )}
          />
        </Field>

        <Field id="transfer-date" label={t('form.date')} error={dateError}>
          <DateInput
            id="transfer-date"
            invalid={Boolean(dateError)}
            {...errorProps('transfer-date', dateError)}
            {...register('date')}
          />
        </Field>

        <Field
          id="transfer-note"
          label={t('form.note')}
          hint={t('form.optional')}
          error={noteError}
        >
          <Textarea
            id="transfer-note"
            rows={2}
            maxLength={TRANSFER_NOTE_MAX_LENGTH}
            placeholder={t('transfer.notePlaceholder')}
            invalid={Boolean(noteError)}
            {...errorProps('transfer-note', noteError)}
            {...register('description')}
          />
          <p aria-hidden className="text-right text-body-sm text-ink-subtle tabular-nums">
            {t('form.noteCount', { count: description.length, max: TRANSFER_NOTE_MAX_LENGTH })}
          </p>
        </Field>

        {saveError && (
          <p
            role="alert"
            className="rounded-sm bg-negative-soft px-3 py-2.5 text-body-sm text-negative"
          >
            {saveError}
          </p>
        )}
      </form>

      <ModalFooter>
        {transaction && (
          <Button
            variant="danger-ghost"
            icon={Trash2}
            onClick={() => setConfirmingDelete(true)}
            disabled={isSubmitting}
            className="-ml-2"
          >
            {t('form.delete')}
          </Button>
        )}
        <Button variant="ghost" className="ml-auto" onClick={requestClose} disabled={isSubmitting}>
          {t('form.cancel')}
        </Button>
        <Button type="submit" form={TRANSFER_FORM_ID} loading={isSubmitting}>
          {t('form.save')}
        </Button>
      </ModalFooter>

      {confirmingDelete && transaction && (
        <ConfirmDeleteDialog
          title={t('transfer.deleteTitle')}
          confirmLabel={t('form.confirmDelete')}
          isPending={deleteTransaction.isPending}
          error={deleteError}
          onConfirm={onDelete}
          onCancel={() => setConfirmingDelete(false)}
        >
          <p>
            {t('form.deleteBody', {
              name:
                transaction.description ||
                t(isCardPayment(transaction) ? 'transfer.cardPayment' : 'transfer.label'),
              amount: money(transaction.amount),
            })}
          </p>
        </ConfirmDeleteDialog>
      )}
    </>
  )
}
