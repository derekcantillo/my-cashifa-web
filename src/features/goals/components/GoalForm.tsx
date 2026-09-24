import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { DeleteConfirmation, errorProps, Field, inputClassName } from '@/components/ui'
import { useCreateGoal, useDeleteGoal, useFormatters, useUpdateGoal } from '@/hooks'
import {
  formatAmountInput,
  fromDateInputValue,
  parseAmountInput,
  toDateInputValue,
} from '@/lib/format'
import { goalPath, ROUTES } from '@/lib/routes'
import { useToastStore } from '@/store/toastStore'
import type { CreateGoalInput, Goal, PlanPhase, UpdateGoalInput } from '@/types'

const PLAN_PHASES = [
  'PHASE_1_DEBT_CONTROL',
  'PHASE_2_OPTIMIZATION',
  'PHASE_3_VEHICLE_PURCHASE',
  'PHASE_4_CONSOLIDATION',
] as const satisfies readonly PlanPhase[]

type ErrorCode =
  | 'nameRequired'
  | 'nameTooLong'
  | 'amountRequired'
  | 'amountInvalid'
  | 'amountPositive'
  | 'dateRequired'

function createSchema(locale: string) {
  return z.object({
    name: z.string().trim().min(1, { error: 'nameRequired' }).max(120, { error: 'nameTooLong' }),
    targetAmount: z
      .string()
      .trim()
      .min(1, { error: 'amountRequired' })
      .refine(value => !Number.isNaN(parseAmountInput(value, locale)), { error: 'amountInvalid' })
      .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' }),
    // Required: the backend's CreateGoalDto rejects a goal without `targetDate`.
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'dateRequired' }),
    // Required by the backend too (`phase` in CreateGoalDto).
    phase: z.enum(PLAN_PHASES),
  })
}

type FormValues = z.infer<ReturnType<typeof createSchema>>

interface GoalFormProps {
  goal?: Goal
  onDone: () => void
}

export function GoalForm({ goal, onDone }: GoalFormProps) {
  const { t } = useTranslation(['goals', 'common'])
  const { locale } = useFormatters()
  const navigate = useNavigate()
  const location = useLocation()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const pushToast = useToastStore(state => state.push)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const schema = useMemo(() => createSchema(locale), [locale])

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: goal
      ? {
          name: goal.name,
          targetAmount: formatAmountInput(goal.targetAmount, locale),
          targetDate: toDateInputValue(goal.targetDate),
          phase: goal.phase,
        }
      : { name: '', targetAmount: '', targetDate: '', phase: 'PHASE_1_DEBT_CONTROL' },
  })

  const onSubmit = async (values: FormValues) => {
    const targetAmount = parseAmountInput(values.targetAmount, locale)
    if (!goal) {
      const input: CreateGoalInput = {
        name: values.name,
        targetAmount,
        targetDate: fromDateInputValue(values.targetDate),
        phase: values.phase,
      }
      await createGoal.mutateAsync(input)
      pushToast(t('toast.saved'))
    } else {
      const input: UpdateGoalInput = {
        ...(dirtyFields.name ? { name: values.name } : {}),
        ...(dirtyFields.targetAmount ? { targetAmount } : {}),
        ...(dirtyFields.targetDate ? { targetDate: fromDateInputValue(values.targetDate) } : {}),
        ...(dirtyFields.phase ? { phase: values.phase } : {}),
      }
      if (Object.keys(input).length > 0) {
        await updateGoal.mutateAsync({ id: goal.id, input })
        pushToast(t('toast.saved'))
      }
    }
    onDone()
  }

  const onDelete = async () => {
    if (!goal) return
    await deleteGoal.mutateAsync(goal.id)
    pushToast(t('toast.deleted'))
    onDone()
    if (location.pathname === goalPath(goal.id)) navigate(ROUTES.goals, { replace: true })
  }

  const errorText = (code: string | undefined) =>
    code ? t(`form.errors.${code as ErrorCode}`) : null
  const nameError = errorText(errors.name?.message)
  const amountError = errorText(errors.targetAmount?.message)
  const dateError = errorText(errors.targetDate?.message)
  const mutation = goal ? updateGoal : createGoal
  const isBusy = isSubmitting || deleteGoal.isPending

  return (
    <form
      noValidate
      onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
      className="space-y-5"
    >
      <Field id="goal-name" label={t('form.name')} error={nameError}>
        <input
          id="goal-name"
          type="text"
          autoComplete="off"
          placeholder={t('form.namePlaceholder')}
          className={inputClassName(nameError)}
          {...errorProps('goal-name', nameError)}
          {...register('name')}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="goal-amount" label={t('form.targetAmount')} error={amountError}>
          <input
            id="goal-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            className={inputClassName(amountError)}
            {...errorProps('goal-amount', amountError)}
            {...register('targetAmount')}
          />
        </Field>
        <Field id="goal-date" label={t('form.targetDate')} error={dateError}>
          <input
            id="goal-date"
            type="date"
            className={inputClassName(dateError)}
            {...errorProps('goal-date', dateError)}
            {...register('targetDate')}
          />
        </Field>
      </div>

      <Field id="goal-phase" label={t('form.phase')}>
        <select id="goal-phase" className={inputClassName(null)} {...register('phase')}>
          {PLAN_PHASES.map(phase => (
            <option key={phase} value={phase}>
              {t(`phases.${phase}`)}
            </option>
          ))}
        </select>
      </Field>

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          {t('form.saveError')}
        </p>
      )}

      {confirmingDelete ? (
        <DeleteConfirmation
          title={t('form.deleteConfirm')}
          isPending={deleteGoal.isPending}
          error={deleteGoal.isError ? t('form.deleteError') : null}
          onConfirm={() => void onDelete().catch(() => undefined)}
          onCancel={() => setConfirmingDelete(false)}
        />
      ) : (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {goal && (
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
