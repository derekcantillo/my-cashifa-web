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
  Modal,
  ModalFooter,
  Select,
  Textarea,
  useModalClose,
  useModalUnsavedChanges,
} from '@/components/ui'
import { useCreateGoalContribution, useFormatters, useGoals } from '@/hooks'
import { fromDateInputValue, parseAmountInput, toDateInputValue } from '@/lib/format'
import { goalPath, ROUTES } from '@/lib/routes'
import { useGoalModalStore } from '@/store/goalModalStore'
import { useToastStore } from '@/store/toastStore'
import type { Goal } from '@/types'

import { groupGoals } from '../lib/goalView'

const FORM_ID = 'contribution-form'
/** CreateContributionDto: `note` is `@MaxLength(255)`. */
const NOTE_MAX_LENGTH = 255

type ErrorCode =
  | 'goalRequired'
  | 'amountRequired'
  | 'amountInvalid'
  | 'amountPositive'
  | 'dateRequired'
  | 'dateFuture'
  | 'noteTooLong'

function createSchema(locale: string, today: string) {
  return z.object({
    goalId: z.string().min(1, { error: 'goalRequired' }),
    amount: z
      .string()
      .trim()
      .min(1, { error: 'amountRequired' })
      .refine(value => !Number.isNaN(parseAmountInput(value, locale)), { error: 'amountInvalid' })
      .refine(value => parseAmountInput(value, locale) > 0, { error: 'amountPositive' }),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'dateRequired' })
      .refine(value => value <= today, { error: 'dateFuture' }),
    note: z.string().trim().max(NOTE_MAX_LENGTH, { error: 'noteTooLong' }),
  })
}

type FormValues = z.infer<ReturnType<typeof createSchema>>

/** Mounted once in AppShell while the store says it's open (mode `contribute`). */
export function ContributionModal() {
  const { t } = useTranslation('goals')
  const close = useGoalModalStore(state => state.close)
  return (
    <Modal title={t('contribution.title')} onClose={close}>
      <ContributionForm onDone={close} />
    </Modal>
  )
}

function ContributionForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation('goals')
  const { locale, money } = useFormatters()
  const fixedGoalId = useGoalModalStore(state => state.goalId)
  const { data: goals = [] } = useGoals()
  const contribute = useCreateGoalContribution()
  const pushToast = useToastStore(state => state.push)
  const requestClose = useModalClose()
  const navigate = useNavigate()
  const location = useLocation()
  const today = toDateInputValue()
  const schema = useMemo(() => createSchema(locale, today), [locale, today])

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { goalId: fixedGoalId ?? '', amount: '', date: today, note: '' },
  })
  useModalUnsavedChanges(isDirty && !isSubmitting)

  const [goalId, amountText] = useWatch({ control, name: ['goalId', 'amount'] })
  const goal = goals.find(item => item.id === goalId)
  const fixedGoal = fixedGoalId ? goals.find(item => item.id === fixedGoalId) : undefined
  const selectable = groupGoals(goals).inProgress

  const remaining = goal ? Math.max(0, goal.targetAmount - goal.currentAmount) : 0
  const amount = parseAmountInput(amountText, locale)
  const excess = goal && !Number.isNaN(amount) ? amount - remaining : 0

  const onSubmit = async (values: FormValues) => {
    const before = goals.find(item => item.id === values.goalId)
    const updated = await contribute.mutateAsync({
      id: values.goalId,
      input: {
        amount: parseAmountInput(values.amount, locale),
        // Same convention as transactions: a past day is pinned to noon Bogotá.
        contributedAt: fromDateInputValue(values.date),
        ...(values.note ? { note: values.note } : {}),
      },
    })
    const justCompleted = updated.status === 'COMPLETED' && before?.status !== 'COMPLETED'
    pushToast(justCompleted ? t('toast.completed', { name: updated.name }) : t('toast.contributed'))
    if (justCompleted && location.pathname === ROUTES.goals) {
      // It moves to "Completadas": select the next active goal, if any.
      const next = groupGoals(goals.filter(item => item.id !== updated.id)).active[0]
      navigate(next ? goalPath(next.id) : ROUTES.goals, { replace: true })
    }
    onDone()
  }

  const errorText = (code: string | undefined) =>
    code ? t(`contribution.errors.${code as ErrorCode}`) : null
  const goalError = errorText(errors.goalId?.message)
  const amountError = errorText(errors.amount?.message)
  const dateError = errorText(errors.date?.message)
  const noteError = errorText(errors.note?.message)

  const amountHelp = goal && remaining > 0 && (
    <span className="tabular-nums">
      {excess > 0
        ? t('contribution.exceeds', { amount: money(excess) })
        : t('contribution.remaining', { amount: money(remaining) })}
    </span>
  )

  return (
    <>
      <form
        id={FORM_ID}
        noValidate
        onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
        className="space-y-5"
      >
        {fixedGoal ? (
          <div className="space-y-1.5">
            <p className="text-body-sm font-medium text-ink">{t('contribution.goal')}</p>
            <p className="rounded-sm bg-surface-sunken px-3 py-2.5 text-body text-ink">
              {fixedGoal.name}
            </p>
          </div>
        ) : (
          <Field id="contribution-goal" label={t('contribution.goal')} error={goalError}>
            <Select
              id="contribution-goal"
              invalid={Boolean(goalError)}
              {...errorProps('contribution-goal', goalError)}
              {...register('goalId')}
            >
              <option value="">{t('contribution.chooseGoal')}</option>
              {selectable.map((item: Goal) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field
          id="contribution-amount"
          label={t('contribution.amount')}
          error={amountError}
          help={amountHelp}
        >
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <AmountField
                id="contribution-amount"
                ref={field.ref}
                name={field.name}
                size="lg"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                invalid={Boolean(amountError)}
                data-autofocus
                {...errorProps('contribution-amount', amountError, Boolean(amountHelp))}
              />
            )}
          />
        </Field>

        <Field id="contribution-date" label={t('contribution.date')} error={dateError}>
          <DateInput
            id="contribution-date"
            max={today}
            invalid={Boolean(dateError)}
            {...errorProps('contribution-date', dateError)}
            {...register('date')}
          />
        </Field>

        <Field
          id="contribution-note"
          label={t('contribution.note')}
          hint={t('contribution.optional')}
          error={noteError}
        >
          <Textarea
            id="contribution-note"
            rows={2}
            maxLength={NOTE_MAX_LENGTH}
            invalid={Boolean(noteError)}
            {...errorProps('contribution-note', noteError)}
            {...register('note')}
          />
        </Field>

        <p className="text-body-sm text-ink-muted">{t('contribution.ledgerHelp')}</p>

        {contribute.isError && (
          <p
            role="alert"
            className="rounded-sm bg-negative-soft px-3 py-2.5 text-body-sm text-negative"
          >
            {t('contribution.saveError')}
          </p>
        )}
      </form>

      <ModalFooter>
        <Button variant="ghost" className="ml-auto" onClick={requestClose} disabled={isSubmitting}>
          {t('contribution.cancel')}
        </Button>
        <Button type="submit" form={FORM_ID} loading={isSubmitting}>
          {t('contribution.save')}
        </Button>
      </ModalFooter>
    </>
  )
}
