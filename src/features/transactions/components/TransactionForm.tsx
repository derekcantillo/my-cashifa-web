import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import {
  AmountField,
  Button,
  CategoryPicker,
  ConfirmDeleteDialog,
  DateInput,
  errorProps,
  Field,
  ModalFooter,
  SegmentedControl,
  Select,
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
import { CATEGORY_META } from '@/lib/categoryMeta'
import {
  formatAmountInput,
  fromDateInputValue,
  parseAmountInput,
  toDateInputValue,
} from '@/lib/format'
import { useToastStore } from '@/store/toastStore'
import {
  CATEGORIES,
  TRANSACTION_TYPES,
  type Category,
  type CreateTransactionInput,
  type RecurringExpense,
  type Transaction,
  type UpdateTransactionInput,
} from '@/types'

import { categoriesForType, FORM_TYPES, isFormType, type FormType } from '../lib/categoriesByType'
import { applyRecurringLink, keepsLink, recurringLinkUpdate } from '../lib/recurringLink'
import { RecurringLinkField, type LinkNotice } from './RecurringLinkField'

export const TRANSACTION_FORM_ID = 'transaction-form'

/**
 * Focuses the first invalid control in DOM order (react-hook-form would follow
 * registration order, which puts the Controller-based amount last). An invalid
 * category fieldset focuses its first option.
 */
function focusFirstError(form: HTMLFormElement): void {
  // Wait for the error state to render.
  requestAnimationFrame(() => {
    const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"]')
    const target =
      invalid instanceof HTMLFieldSetElement
        ? invalid.querySelector<HTMLElement>('input:checked, input')
        : invalid
    target?.focus()
  })
}

/** Same limit as the backend DTO (`@MaxLength(255)` on `description`). */
const NOTE_MAX_LENGTH = 255

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
    amount: z
      .string()
      .trim()
      .min(1, { error: 'amountRequired' })
      .refine(value => !Number.isNaN(parseAmountInput(value, locale)), {
        error: 'amountInvalid',
      })
      .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' }),
    category: z
      .union([z.enum(CATEGORIES), z.literal('')])
      .refine(value => value !== '', { error: 'categoryRequired' }),
    recurringExpenseId: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'dateRequired' }),
    accountId: z.string(),
    description: z.string().trim().max(NOTE_MAX_LENGTH, { error: 'noteTooLong' }),
  })
}

type Schema = ReturnType<typeof createSchema>
/** What the fields hold (category may be '' while nothing is picked). */
type FormValues = z.input<Schema>
/** What reaches `onSubmit` once validated. */
type SubmitValues = z.output<Schema>

interface TransactionFormProps {
  /** Present in edit mode. */
  transaction?: Transaction
  /** Create mode: start linked to this recurring expense. */
  recurringExpense?: RecurringExpense
  /** Names linked recurring expenses (edit mode, delete warning). */
  recurringExpenses: readonly RecurringExpense[]
  onDone: () => void
}

/**
 * Create / view-and-edit form of a movement. Lives inside the transaction Modal: its
 * actions go to the modal's pinned footer (`ModalFooter`) and unsaved changes make
 * closing ask first.
 */
export function TransactionForm({
  transaction,
  recurringExpense,
  recurringExpenses,
  onDone,
}: TransactionFormProps) {
  const { t } = useTranslation(['transactions', 'categories'])
  const { locale, money } = useFormatters()
  const { data: accounts = [] } = useAccounts()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const pushToast = useToastStore(state => state.push)
  const requestClose = useModalClose()
  const apiErrorMessages = useApiErrorMessages()
  const schema = useMemo(() => createSchema(locale), [locale])

  const isEdit = transaction !== undefined
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [linkNotice, setLinkNotice] = useState<LinkNotice | null>(null)
  // What the user changed by hand (autofill never overwrites those). An edited
  // movement's amount and category are real values, so linking never replaces the
  // amount and says so when it changes the category.
  const [editedByUser, setEditedByUser] = useState({ amount: isEdit, category: isEdit })
  const markEdited = (field: 'amount' | 'category') =>
    setEditedByUser(current => (current[field] ? current : { ...current, [field]: true }))
  const typeIsEditable = !transaction || isFormType(transaction.type)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm<FormValues, unknown, SubmitValues>({
    resolver: zodResolver(schema),
    // Focus goes to the first invalid field in visual order (see `focusFirstError`).
    shouldFocusError: false,
    defaultValues: transaction
      ? {
          type: transaction.type,
          amount: formatAmountInput(transaction.amount, locale),
          category: transaction.category,
          recurringExpenseId: transaction.recurringExpenseId ?? '',
          date: toDateInputValue(transaction.transactionDate),
          accountId: transaction.accountId ?? '',
          description: transaction.description ?? '',
        }
      : {
          type: 'EXPENSE',
          amount: recurringExpense
            ? formatAmountInput(recurringExpense.estimatedAmount, locale)
            : '',
          category: recurringExpense?.category ?? '',
          recurringExpenseId: recurringExpense?.id ?? '',
          date: toDateInputValue(),
          accountId: '',
          description: '',
        },
  })

  useModalUnsavedChanges(isDirty && !isSubmitting)

  const [type, amount, date, recurringExpenseId, description] = useWatch({
    control,
    name: ['type', 'amount', 'date', 'recurringExpenseId', 'description'],
  })

  const categories = categoriesForType(type, transaction?.category)
  const recurringById = useMemo(() => {
    const map = new Map(recurringExpenses.map(item => [item.id, item]))
    if (recurringExpense) map.set(recurringExpense.id, recurringExpense)
    return map
  }, [recurringExpenses, recurringExpense])
  const linked = recurringExpenseId ? recurringById.get(recurringExpenseId) : undefined

  const changeType = (next: FormType) => {
    setValue('type', next, { shouldDirty: true })
    const current = getValues('category')
    if (current && !categoriesForType(next, transaction?.category).includes(current)) {
      setValue('category', '', { shouldDirty: true })
    }
    // Recurring expenses are expenses: switching to income drops the link.
    if (next !== 'EXPENSE' && getValues('recurringExpenseId')) {
      setValue('recurringExpenseId', '', { shouldDirty: true })
      setLinkNotice(null)
    }
  }

  const link = (id: string) => {
    setValue('recurringExpenseId', id, { shouldDirty: true })
    const recurring = id ? recurringById.get(id) : undefined
    if (!recurring) {
      setLinkNotice(null)
      return
    }
    const patch = applyRecurringLink(
      {
        amount: getValues('amount'),
        category: getValues('category'),
        amountEditedByUser: editedByUser.amount,
        categoryEditedByUser: editedByUser.category,
      },
      recurring,
      locale,
    )
    if (patch.amount !== undefined) setValue('amount', patch.amount, { shouldDirty: true })
    setValue('category', patch.category, {
      shouldDirty: true,
      shouldValidate: Boolean(errors.category),
    })
    setLinkNotice(patch.categoryReplaced ? { kind: 'categorySet', category: patch.category } : null)
  }

  const categoryRegistration = register('category', {
    onChange: event => {
      markEdited('category')
      const next = (event.target as HTMLInputElement).value as Category
      // A category picked by hand that isn't the recurring expense's drops the link.
      if (linked && !keepsLink(linked, next)) {
        setValue('recurringExpenseId', '', { shouldDirty: true })
        setLinkNotice({ kind: 'unlinkedByCategory', name: linked.name })
      }
    },
  })

  const onSubmit = async (values: SubmitValues) => {
    const amount = parseAmountInput(values.amount, locale)
    if (!transaction) {
      const input: CreateTransactionInput = {
        type: values.type,
        category: values.category,
        amount,
        transactionDate: fromDateInputValue(values.date),
        ...(values.accountId ? { accountId: values.accountId } : {}),
        ...(values.description ? { description: values.description } : {}),
        ...(values.type === 'EXPENSE' && values.recurringExpenseId
          ? { recurringExpenseId: values.recurringExpenseId }
          : {}),
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
        // Only when the user changed it: `null` unlinks. A category change that no
        // longer matches already cleared the link in the form (with a notice).
        ...recurringLinkUpdate(transaction.recurringExpenseId, values.recurringExpenseId),
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

  const errorText = (code: string | undefined) =>
    code ? t(`transactions:form.errors.${code as ErrorCode}`) : null
  const amountError = errorText(errors.amount?.message)
  const categoryError = errorText(errors.category?.message)
  const dateError = errorText(errors.date?.message)
  const noteError = errorText(errors.description?.message)
  // A 400 here is most likely a category that doesn't match the linked recurring
  // expense; a 409, a loan movement opened from stale data.
  const saveError = apiErrorMessage(createTransaction.error ?? updateTransaction.error, {
    ...apiErrorMessages,
    validation: t('transactions:form.saveValidationError'),
    unknown: t('transactions:form.saveError'),
  })
  const deleteError = apiErrorMessage(deleteTransaction.error, {
    ...apiErrorMessages,
    unknown: t('transactions:form.deleteError'),
  })
  const transactionName = transaction
    ? transaction.description || t(CATEGORY_META[transaction.category].translationKey)
    : ''
  const linkedOnServer = transaction?.recurringExpenseId
    ? recurringById.get(transaction.recurringExpenseId)
    : undefined

  return (
    <>
      <form
        id={TRANSACTION_FORM_ID}
        noValidate
        onSubmit={event => {
          // Captured now: React clears `currentTarget` once the handler returns.
          const form = event.currentTarget
          void handleSubmit(onSubmit, () => focusFirstError(form))(event).catch(() => undefined)
        }}
        className="space-y-6"
      >
        {typeIsEditable ? (
          <SegmentedControl
            label={t('transactions:form.type')}
            value={isFormType(type) ? type : 'EXPENSE'}
            onChange={changeType}
            options={FORM_TYPES.map(value => ({
              value,
              label:
                value === 'EXPENSE'
                  ? t('transactions:form.expense')
                  : t('transactions:form.income'),
            }))}
          />
        ) : (
          <p className="text-body-sm text-ink-muted">
            {t('transactions:form.otherType', {
              type: t(`transactions:types.${transaction.type}`),
            })}
          </p>
        )}

        <Field id="transaction-amount" label={t('transactions:form.amount')} error={amountError}>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <AmountField
                id="transaction-amount"
                ref={field.ref}
                name={field.name}
                size="lg"
                value={field.value}
                onChange={value => {
                  markEdited('amount')
                  field.onChange(value)
                }}
                onBlur={field.onBlur}
                placeholder="0"
                invalid={Boolean(amountError)}
                data-autofocus
                {...errorProps('transaction-amount', amountError)}
              />
            )}
          />
        </Field>

        <CategoryPicker
          id="transaction-category"
          legend={t('transactions:form.category')}
          categories={categories}
          registration={categoryRegistration}
          error={categoryError}
        />

        {type === 'EXPENSE' ? (
          <RecurringLinkField
            value={recurringExpenseId}
            originalId={transaction?.recurringExpenseId ?? undefined}
            amount={amount}
            date={date}
            linked={linked}
            notice={linkNotice}
            onChange={link}
          />
        ) : (
          // A non-expense type the form can't switch (e.g. a debt payment) may still be
          // linked: shown, not editable here.
          linked && (
            <p className="rounded-sm bg-surface-sunken px-3 py-2.5 text-body-sm font-medium text-ink">
              {t('transactions:form.recurring.linked', { name: linked.name })}
            </p>
          )
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="transaction-date" label={t('transactions:form.date')} error={dateError}>
            <DateInput
              id="transaction-date"
              invalid={Boolean(dateError)}
              {...errorProps('transaction-date', dateError)}
              {...register('date')}
            />
          </Field>
          <Field
            id="transaction-account"
            label={t('transactions:form.account')}
            hint={t('transactions:form.optional')}
          >
            <Select id="transaction-account" {...register('accountId')}>
              <option value="">{t('transactions:form.noAccount')}</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          id="transaction-note"
          label={t('transactions:form.note')}
          hint={t('transactions:form.optional')}
          error={noteError}
        >
          <Textarea
            id="transaction-note"
            rows={2}
            maxLength={NOTE_MAX_LENGTH}
            placeholder={t('transactions:form.notePlaceholder')}
            invalid={Boolean(noteError)}
            {...errorProps('transaction-note', noteError)}
            {...register('description')}
          />
          <p aria-hidden className="text-right text-body-sm text-ink-subtle tabular-nums">
            {t('transactions:form.noteCount', {
              count: description.length,
              max: NOTE_MAX_LENGTH,
            })}
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
            {t('transactions:form.delete')}
          </Button>
        )}
        <Button variant="ghost" className="ml-auto" onClick={requestClose} disabled={isSubmitting}>
          {t('transactions:form.cancel')}
        </Button>
        <Button type="submit" form={TRANSACTION_FORM_ID} loading={isSubmitting}>
          {t('transactions:form.save')}
        </Button>
      </ModalFooter>

      {confirmingDelete && transaction && (
        <ConfirmDeleteDialog
          title={t('transactions:form.deleteTitle')}
          confirmLabel={t('transactions:form.confirmDelete')}
          isPending={deleteTransaction.isPending}
          error={deleteError}
          onConfirm={onDelete}
          onCancel={() => setConfirmingDelete(false)}
        >
          <p>
            {t('transactions:form.deleteBody', {
              name: transactionName,
              amount: money(transaction.amount),
            })}
          </p>
          {linkedOnServer?.active && (
            <p>{t('transactions:form.deleteRecurring', { name: linkedOnServer.name })}</p>
          )}
        </ConfirmDeleteDialog>
      )}
    </>
  )
}
