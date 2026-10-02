import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
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
  useModalClose,
  useModalUnsavedChanges,
} from '@/components/ui'
import { useCreateGoal, useFormatters, useUpdateGoal } from '@/hooks'
import {
  formatAmountInput,
  fromDateInputValue,
  parseAmountInput,
  toDateInputValue,
} from '@/lib/format'
import { goalPath, ROUTES } from '@/lib/routes'
import { useToastStore } from '@/store/toastStore'
import type { CreateGoalInput, Goal, PlanPhase, UpdateGoalInput } from '@/types'

const FORM_ID = 'goal-form'
/** CreateGoalDto: `name` is `@MaxLength(120)`. */
const NAME_MAX_LENGTH = 120

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
  | 'currentInvalid'
  | 'currentAboveTarget'
  | 'dateRequired'
  | 'datePast'

/**
 * `targetDate` and `phase` are required by CreateGoalDto. Like the mobile app: the
 * date picker starts today (the backend would take a past date, the mobile doesn't
 * offer one), and "already saved" can only be set on creation and can't exceed the
 * target. On edit only a date the user changes is checked.
 */
function createSchema(locale: string, today: string, isEdit: boolean) {
  const amount = z
    .string()
    .trim()
    .min(1, { error: 'amountRequired' })
    .refine(value => !Number.isNaN(parseAmountInput(value, locale)), { error: 'amountInvalid' })
    .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' })
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { error: 'nameRequired' })
        .max(NAME_MAX_LENGTH, { error: 'nameTooLong' }),
      targetAmount: amount,
      currentAmount: z
        .string()
        .trim()
        .refine(value => value === '' || !Number.isNaN(parseAmountInput(value, locale)), {
          error: 'currentInvalid',
        }),
      targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'dateRequired' }),
      phase: z.enum(PLAN_PHASES),
    })
    .superRefine((values, context) => {
      if (!isEdit && values.targetDate && values.targetDate < today) {
        context.addIssue({ code: 'custom', path: ['targetDate'], message: 'datePast' })
      }
      const current = values.currentAmount ? parseAmountInput(values.currentAmount, locale) : 0
      const target = parseAmountInput(values.targetAmount, locale)
      if (!isEdit && current > target) {
        context.addIssue({ code: 'custom', path: ['currentAmount'], message: 'currentAboveTarget' })
      }
    })
}

type FormValues = z.infer<ReturnType<typeof createSchema>>

interface GoalFormProps {
  goal?: Goal
  onDone: () => void
}

/** Create / edit form, inside the goal Modal (actions go to its pinned footer). */
export function GoalForm({ goal, onDone }: GoalFormProps) {
  const { t } = useTranslation(['goals', 'common'])
  const { locale, money } = useFormatters()
  const navigate = useNavigate()
  const location = useLocation()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const pushToast = useToastStore(state => state.push)
  const requestClose = useModalClose()
  const today = toDateInputValue()
  const isEdit = goal !== undefined
  const schema = useMemo(() => createSchema(locale, today, isEdit), [locale, today, isEdit])

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: goal
      ? {
          name: goal.name,
          targetAmount: formatAmountInput(goal.targetAmount, locale),
          currentAmount: '',
          targetDate: toDateInputValue(goal.targetDate),
          phase: goal.phase,
        }
      : {
          name: '',
          targetAmount: '',
          currentAmount: '',
          targetDate: '',
          phase: 'PHASE_1_DEBT_CONTROL',
        },
  })
  useModalUnsavedChanges(isDirty && !isSubmitting)

  const targetText = useWatch({ control, name: 'targetAmount' })
  const newTarget = parseAmountInput(targetText, locale)
  // The backend doesn't stop it (and doesn't reopen/complete anything): warn, don't block.
  const belowSaved = isEdit && !Number.isNaN(newTarget) && newTarget < goal.currentAmount

  const onSubmit = async (values: FormValues) => {
    const targetAmount = parseAmountInput(values.targetAmount, locale)
    if (!goal) {
      const currentAmount = values.currentAmount
        ? parseAmountInput(values.currentAmount, locale)
        : 0
      const input: CreateGoalInput = {
        name: values.name,
        targetAmount,
        targetDate: fromDateInputValue(values.targetDate),
        phase: values.phase,
        ...(currentAmount > 0 ? { currentAmount } : {}),
      }
      const created = await createGoal.mutateAsync(input)
      pushToast(t('goals:toast.saved'))
      if (location.pathname === ROUTES.goals) navigate(goalPath(created.id))
    } else {
      const input: UpdateGoalInput = {
        ...(dirtyFields.name ? { name: values.name } : {}),
        ...(dirtyFields.targetAmount ? { targetAmount } : {}),
        ...(dirtyFields.targetDate ? { targetDate: fromDateInputValue(values.targetDate) } : {}),
        ...(dirtyFields.phase ? { phase: values.phase } : {}),
      }
      if (Object.keys(input).length > 0) {
        await updateGoal.mutateAsync({ id: goal.id, input })
        pushToast(t('goals:toast.saved'))
      }
    }
    onDone()
  }

  const errorText = (code: string | undefined) =>
    code ? t(`goals:form.errors.${code as ErrorCode}`) : null
  const nameError = errorText(errors.name?.message)
  const amountError = errorText(errors.targetAmount?.message)
  const currentError = errorText(errors.currentAmount?.message)
  const dateError = errorText(errors.targetDate?.message)
  const mutation = goal ? updateGoal : createGoal

  return (
    <>
      <form
        id={FORM_ID}
        noValidate
        onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
        className="space-y-5"
      >
        <Field id="goal-name" label={t('goals:form.name')} error={nameError}>
          <Input
            id="goal-name"
            autoComplete="off"
            maxLength={NAME_MAX_LENGTH}
            placeholder={t('goals:form.namePlaceholder')}
            invalid={Boolean(nameError)}
            data-autofocus
            {...errorProps('goal-name', nameError)}
            {...register('name')}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="goal-target"
            label={t('goals:form.targetAmount')}
            error={amountError}
            help={
              belowSaved
                ? t('goals:form.belowSaved', { saved: money(goal.currentAmount) })
                : undefined
            }
          >
            <Controller
              control={control}
              name="targetAmount"
              render={({ field }) => (
                <AmountField
                  id="goal-target"
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                  invalid={Boolean(amountError)}
                  {...errorProps('goal-target', amountError, belowSaved)}
                />
              )}
            />
          </Field>
          <Field id="goal-date" label={t('goals:form.targetDate')} error={dateError}>
            <DateInput
              id="goal-date"
              min={isEdit ? undefined : today}
              invalid={Boolean(dateError)}
              {...errorProps('goal-date', dateError)}
              {...register('targetDate')}
            />
          </Field>
        </div>

        {!isEdit && (
          <Field
            id="goal-current"
            label={t('goals:form.currentAmount')}
            hint={t('goals:form.optional')}
            help={t('goals:form.currentAmountHelp')}
            error={currentError}
          >
            <Controller
              control={control}
              name="currentAmount"
              render={({ field }) => (
                <AmountField
                  id="goal-current"
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                  invalid={Boolean(currentError)}
                  {...errorProps('goal-current', currentError, true)}
                />
              )}
            />
          </Field>
        )}

        <Field id="goal-phase" label={t('goals:form.phase')}>
          <Select id="goal-phase" {...register('phase')}>
            {PLAN_PHASES.map(phase => (
              <option key={phase} value={phase}>
                {t(`goals:phases.${phase}`)}
              </option>
            ))}
          </Select>
        </Field>

        {mutation.isError && (
          <p
            role="alert"
            className="rounded-sm bg-negative-soft px-3 py-2.5 text-body-sm text-negative"
          >
            {t('goals:form.saveError')}
          </p>
        )}
      </form>

      <ModalFooter>
        <Button variant="ghost" className="ml-auto" onClick={requestClose} disabled={isSubmitting}>
          {t('goals:form.cancel')}
        </Button>
        <Button type="submit" form={FORM_ID} loading={isSubmitting}>
          {t('goals:form.save')}
        </Button>
      </ModalFooter>
    </>
  )
}
