import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { DeleteConfirmation, Field, FieldError, inputClassName } from '@/components/ui'
import {
  useAccounts,
  useCreateTransaction,
  useDeleteTransaction,
  useFormatters,
  useUpdateTransaction,
} from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import {
  formatAmountInput,
  fromDateInputValue,
  parseAmountInput,
  toDateInputValue,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'
import {
  CATEGORIES,
  TRANSACTION_TYPES,
  type CreateTransactionInput,
  type Transaction,
  type UpdateTransactionInput,
} from '@/types'

/** This generic form only creates expenses and income; loans have their own flow. */
const EDITABLE_TYPES = ['EXPENSE', 'INCOME'] as const

type ErrorCode =
  | 'categoryRequired'
  | 'amountRequired'
  | 'amountInvalid'
  | 'amountPositive'
  | 'dateRequired'
  | 'noteTooLong'

function createSchema(locale: string) {
  return z.object({
    type: z.enum(TRANSACTION_TYPES),
    category: z.enum(CATEGORIES, { error: 'categoryRequired' }),
    amount: z
      .string()
      .trim()
      .min(1, { error: 'amountRequired' })
      .refine(value => !Number.isNaN(parseAmountInput(value, locale)), {
        error: 'amountInvalid',
      })
      .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'dateRequired' }),
    accountId: z.string(),
    description: z.string().trim().max(255, { error: 'noteTooLong' }),
  })
}

type FormValues = z.infer<ReturnType<typeof createSchema>>

interface TransactionFormProps {
  /** Present in edit mode. */
  transaction?: Transaction
  onDone: () => void
}

export function TransactionForm({ transaction, onDone }: TransactionFormProps) {
  const { t } = useTranslation(['transactions', 'categories'])
  const { locale } = useFormatters()
  const { data: accounts = [] } = useAccounts()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const pushToast = useToastStore(state => state.push)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const schema = useMemo(() => createSchema(locale), [locale])

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          category: transaction.category,
          amount: formatAmountInput(transaction.amount, locale),
          date: toDateInputValue(transaction.transactionDate),
          accountId: transaction.accountId ?? '',
          description: transaction.description ?? '',
        }
      : { type: 'EXPENSE', amount: '', date: toDateInputValue(), accountId: '', description: '' },
  })

  const mutation = transaction ? updateTransaction : createTransaction
  const typeIsEditable =
    !transaction || (EDITABLE_TYPES as readonly string[]).includes(transaction.type)

  const onSubmit = async (values: FormValues) => {
    const amount = parseAmountInput(values.amount, locale)
    if (!transaction) {
      const input: CreateTransactionInput = {
        type: values.type,
        category: values.category,
        amount,
        transactionDate: fromDateInputValue(values.date),
        ...(values.accountId ? { accountId: values.accountId } : {}),
        ...(values.description ? { description: values.description } : {}),
      }
      await createTransaction.mutateAsync(input)
      pushToast(t('transactions:toast.saved'))
    } else {
      // PATCH only what changed, so an untouched date keeps its original time.
      const input: UpdateTransactionInput = {
        ...(dirtyFields.type && typeIsEditable ? { type: values.type } : {}),
        ...(dirtyFields.category ? { category: values.category } : {}),
        ...(dirtyFields.amount ? { amount } : {}),
        ...(dirtyFields.date ? { transactionDate: fromDateInputValue(values.date) } : {}),
        ...(dirtyFields.accountId ? { accountId: values.accountId || null } : {}),
        ...(dirtyFields.description ? { description: values.description } : {}),
      }
      if (Object.keys(input).length > 0) {
        await updateTransaction.mutateAsync({ id: transaction.id, input })
        pushToast(t('transactions:toast.saved'))
      }
    }
    onDone()
  }

  const onDelete = () => {
    if (!transaction) return
    deleteTransaction.mutate(transaction.id, {
      onSuccess: () => {
        pushToast(t('transactions:toast.deleted'))
        onDone()
      },
    })
  }

  const isBusy = isSubmitting || deleteTransaction.isPending

  const errorText = (code: string | undefined) =>
    code ? t(`transactions:form.errors.${code as ErrorCode}`) : null

  const amountError = errorText(errors.amount?.message)
  const categoryError = errorText(errors.category?.message)
  const dateError = errorText(errors.date?.message)
  const noteError = errorText(errors.description?.message)

  return (
    <form
      noValidate
      onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
      className="space-y-6"
    >
      {typeIsEditable ? (
        <fieldset>
          <legend className="sr-only">{t('transactions:form.type')}</legend>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface p-1">
            {EDITABLE_TYPES.map(type => (
              <label
                key={type}
                className="cursor-pointer rounded-md py-2 text-center text-sm text-ink-muted transition-colors has-checked:bg-surface-elevated has-checked:font-medium has-checked:text-ink has-checked:shadow-sm has-checked:ring-1 has-checked:ring-border has-focus-visible:ring-2 has-focus-visible:ring-brand"
              >
                <input type="radio" value={type} className="sr-only" {...register('type')} />
                {type === 'EXPENSE'
                  ? t('transactions:form.expense')
                  : t('transactions:form.income')}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="text-sm text-ink-muted">
          {t('transactions:form.otherType', { type: t(`transactions:types.${transaction.type}`) })}
        </p>
      )}

      <fieldset aria-describedby={categoryError ? 'category-error' : undefined}>
        <legend className="mb-2 text-sm font-medium">{t('transactions:form.category')}</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {CATEGORIES.map(category => {
            const meta = CATEGORY_META[category]
            const Icon = meta.icon
            return (
              <label
                key={category}
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-border px-1 py-2.5 text-center text-xs text-ink-muted transition-colors hover:text-ink has-checked:border-brand has-checked:bg-brand/10 has-checked:text-brand has-focus-visible:ring-2 has-focus-visible:ring-brand"
              >
                <input
                  type="radio"
                  value={category}
                  className="sr-only"
                  {...register('category')}
                />
                <Icon className="size-5" aria-hidden />
                <span className="leading-tight">{t(meta.translationKey)}</span>
              </label>
            )
          })}
        </div>
        {categoryError && <FieldError id="category-error">{categoryError}</FieldError>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="amount" label={t('transactions:form.amount')} error={amountError}>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={t('transactions:form.amountPlaceholder')}
            aria-invalid={amountError ? true : undefined}
            aria-describedby={amountError ? 'amount-error' : undefined}
            className={inputClassName(amountError)}
            {...register('amount')}
          />
        </Field>
        <Field id="date" label={t('transactions:form.date')} error={dateError}>
          <input
            id="date"
            type="date"
            aria-invalid={dateError ? true : undefined}
            aria-describedby={dateError ? 'date-error' : undefined}
            className={inputClassName(dateError)}
            {...register('date')}
          />
        </Field>
      </div>

      <Field
        id="accountId"
        label={t('transactions:form.account')}
        hint={t('transactions:form.optional')}
      >
        <select id="accountId" className={inputClassName(null)} {...register('accountId')}>
          <option value="">{t('transactions:form.noAccount')}</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="description"
        label={t('transactions:form.note')}
        hint={t('transactions:form.optional')}
        error={noteError}
      >
        <textarea
          id="description"
          rows={2}
          placeholder={t('transactions:form.notePlaceholder')}
          aria-invalid={noteError ? true : undefined}
          aria-describedby={noteError ? 'description-error' : undefined}
          className={cn(inputClassName(noteError), 'resize-none')}
          {...register('description')}
        />
      </Field>

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          {t('transactions:form.saveError')}
        </p>
      )}

      {confirmingDelete ? (
        <DeleteConfirmation
          title={t('transactions:form.deleteConfirm')}
          isPending={deleteTransaction.isPending}
          error={deleteTransaction.isError ? t('transactions:form.deleteError') : null}
          onConfirm={onDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      ) : (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {transaction && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={isBusy}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-60 sm:-ml-3"
            >
              {t('transactions:form.delete')}
            </button>
          )}
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
          >
            {isSubmitting ? t('transactions:form.saving') : t('transactions:form.save')}
          </button>
        </div>
      )}
    </form>
  )
}
