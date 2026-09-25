import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import {
  CategoryPicker,
  DeleteConfirmation,
  errorProps,
  Field,
  inputClassName,
} from '@/components/ui'
import {
  useCreateRecurringExpense,
  useDeleteRecurringExpense,
  useFormatters,
  useUpdateRecurringExpense,
} from '@/hooks'
import { formatAmountInput, parseAmountInput } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'
import {
  CATEGORIES,
  type CreateRecurringExpenseInput,
  type RecurringExpense,
  type UpdateRecurringExpenseInput,
} from '@/types'

type ErrorCode =
  | 'nameRequired'
  | 'nameTooLong'
  | 'categoryRequired'
  | 'amountRequired'
  | 'amountInvalid'
  | 'amountPositive'
  | 'dayInvalid'

function createSchema(locale: string) {
  return z.object({
    name: z.string().trim().min(1, { error: 'nameRequired' }).max(120, { error: 'nameTooLong' }),
    category: z.enum(CATEGORIES, { error: 'categoryRequired' }),
    estimatedAmount: z
      .string()
      .trim()
      .min(1, { error: 'amountRequired' })
      .refine(value => !Number.isNaN(parseAmountInput(value, locale)), { error: 'amountInvalid' })
      .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' }),
    // Required by the backend (CreateRecurringExpenseDto: integer 1–31).
    dayOfMonth: z
      .string()
      .trim()
      .refine(value => /^\d{1,2}$/.test(value) && Number(value) >= 1 && Number(value) <= 31, {
        error: 'dayInvalid',
      }),
  })
}

type FormValues = z.infer<ReturnType<typeof createSchema>>

interface RecurringExpenseFormProps {
  expense?: RecurringExpense
  onDone: () => void
}

export function RecurringExpenseForm({ expense, onDone }: RecurringExpenseFormProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { locale } = useFormatters()
  const create = useCreateRecurringExpense()
  const update = useUpdateRecurringExpense()
  const remove = useDeleteRecurringExpense()
  const pushToast = useToastStore(state => state.push)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const schema = useMemo(() => createSchema(locale), [locale])

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: expense
      ? {
          name: expense.name,
          category: expense.category,
          estimatedAmount: formatAmountInput(expense.estimatedAmount, locale),
          dayOfMonth: String(expense.dayOfMonth),
        }
      : { name: '', estimatedAmount: '', dayOfMonth: '' },
  })

  const onSubmit = async (values: FormValues) => {
    const estimatedAmount = parseAmountInput(values.estimatedAmount, locale)
    const dayOfMonth = Number(values.dayOfMonth)
    if (!expense) {
      const input: CreateRecurringExpenseInput = {
        name: values.name,
        category: values.category,
        estimatedAmount,
        dayOfMonth,
      }
      await create.mutateAsync(input)
      pushToast(t('recurring.saved'))
    } else {
      const input: UpdateRecurringExpenseInput = {
        ...(dirtyFields.name ? { name: values.name } : {}),
        ...(dirtyFields.category ? { category: values.category } : {}),
        ...(dirtyFields.estimatedAmount ? { estimatedAmount } : {}),
        ...(dirtyFields.dayOfMonth ? { dayOfMonth } : {}),
      }
      if (Object.keys(input).length > 0) {
        await update.mutateAsync({ id: expense.id, input })
        pushToast(t('recurring.saved'))
      }
    }
    onDone()
  }

  const onDelete = async () => {
    if (!expense) return
    await remove.mutateAsync(expense.id)
    pushToast(t('recurring.deleted'))
    onDone()
  }

  const errorText = (code: string | undefined) =>
    code ? t(`recurring.errors.${code as ErrorCode}`) : null
  const nameError = errorText(errors.name?.message)
  const categoryError = errorText(errors.category?.message)
  const amountError = errorText(errors.estimatedAmount?.message)
  const dayError = errorText(errors.dayOfMonth?.message)
  const mutation = expense ? update : create
  const isBusy = isSubmitting || remove.isPending

  return (
    <form
      noValidate
      onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
      className="space-y-5"
    >
      <Field id="recurring-name" label={t('recurring.name')} error={nameError}>
        <input
          id="recurring-name"
          type="text"
          autoComplete="off"
          placeholder={t('recurring.namePlaceholder')}
          className={inputClassName(nameError)}
          {...errorProps('recurring-name', nameError)}
          {...register('name')}
        />
      </Field>

      <CategoryPicker
        id="recurring-category"
        legend={t('recurring.category')}
        registration={register('category')}
        error={categoryError}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="recurring-amount" label={t('recurring.estimatedAmount')} error={amountError}>
          <input
            id="recurring-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            className={inputClassName(amountError)}
            {...errorProps('recurring-amount', amountError)}
            {...register('estimatedAmount')}
          />
        </Field>
        <Field id="recurring-day" label={t('recurring.dayOfMonth')} error={dayError}>
          <input
            id="recurring-day"
            type="number"
            min={1}
            max={31}
            step={1}
            inputMode="numeric"
            className={inputClassName(dayError)}
            {...errorProps('recurring-day', dayError)}
            {...register('dayOfMonth')}
          />
        </Field>
      </div>

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          {t('recurring.saveError')}
        </p>
      )}

      {confirmingDelete ? (
        <DeleteConfirmation
          title={t('recurring.deleteConfirm')}
          isPending={remove.isPending}
          error={remove.isError ? t('recurring.deleteError') : null}
          onConfirm={() => void onDelete().catch(() => undefined)}
          onCancel={() => setConfirmingDelete(false)}
        />
      ) : (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {expense && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={isBusy}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-60 sm:-ml-3"
            >
              {t('common:common.delete')}
            </button>
          )}
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
          >
            {isSubmitting ? t('common:common.saving') : t('common:common.save')}
          </button>
        </div>
      )}
    </form>
  )
}
