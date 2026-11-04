import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  Amount,
  AmountField,
  Button,
  DateInput,
  errorProps,
  Field,
  Input,
  Modal,
  ModalFooter,
  SectionError,
  Skeleton,
} from '@/components/ui'
import {
  useAnchorToStatement,
  useApiErrorMessages,
  useBalanceAdjustments,
  useFormatters,
  useRevertAdjustment,
} from '@/hooks'
import { apiErrorMessage } from '@/lib/apiError'
import { dateKeyToDate, formatDate, toDateInputValue } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'
import type {
  Account,
  BalanceAdjustment,
  BalanceAdjustmentResult,
  StatementBalanceInput,
} from '@/types'

import { isCardType } from '../lib/accountForm'
import {
  anchorErrorMessages,
  anchorPreview,
  bankBalanceDefaults,
  cardStatementDefaults,
  createBankBalanceSchema,
  createCardStatementSchema,
  toBankBalanceInput,
  toCardStatementInput,
  undoableAdjustmentId,
  type AnchorErrorCode,
  type BankBalanceValues,
  type CardStatementValues,
} from '../lib/statementAnchor'

const ANCHOR_FORM_ID = 'anchor-form'

type Step =
  | { name: 'form' }
  | { name: 'review'; input: StatementBalanceInput }
  | { name: 'done'; result: BalanceAdjustmentResult }

/**
 * "Ajustar al extracto" (card: cut date, debt, limit) or "Ajustar al saldo del banco"
 * (date, balance). Three steps: the form, a review that says in plain words what
 * changes, and the result with the balance before and after from the backend (and
 * "Deshacer"). The history of adjustments is below, with "Deshacer" on the newest.
 */
export function StatementAnchorModal({
  account,
  onClose,
}: {
  account: Account
  onClose: () => void
}) {
  const { t } = useTranslation('settings')
  const card = isCardType(account.type)
  const [step, setStep] = useState<Step>({ name: 'form' })

  return (
    <Modal
      title={t(card ? 'anchor.cardTitle' : 'anchor.bankTitle', { name: account.name })}
      onClose={onClose}
    >
      <div className="space-y-8">
        {step.name === 'form' &&
          (card ? (
            <CardStatementForm
              account={account}
              onReview={input => setStep({ name: 'review', input })}
            />
          ) : (
            <BankBalanceForm onReview={input => setStep({ name: 'review', input })} />
          ))}
        {step.name === 'review' && (
          <Review
            account={account}
            input={step.input}
            onBack={() => setStep({ name: 'form' })}
            onDone={result => setStep({ name: 'done', result })}
          />
        )}
        {step.name === 'done' && <Done result={step.result} onClose={onClose} />}
        <History account={account} />
      </div>
    </Modal>
  )
}

function useErrorText() {
  const { t } = useTranslation('settings')
  return (code: string | undefined) => (code ? t(`anchor.errors.${code as AnchorErrorCode}`) : null)
}

function CardStatementForm({
  account,
  onReview,
}: {
  account: Account
  onReview: (input: StatementBalanceInput) => void
}) {
  const { t } = useTranslation('settings')
  const { locale } = useFormatters()
  const today = toDateInputValue()
  const limitRequired = !account.creditCard?.configured
  const schema = useMemo(
    () => createCardStatementSchema(locale, today, limitRequired),
    [locale, today, limitRequired],
  )
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardStatementValues>({
    resolver: zodResolver(schema),
    defaultValues: cardStatementDefaults(account, locale),
  })
  const errorText = useErrorText()
  const cutError = errorText(errors.cutDate?.message)
  const debtError = errorText(errors.totalDebt?.message)
  const limitError = errorText(errors.creditLimit?.message)

  return (
    <>
      <form
        id={ANCHOR_FORM_ID}
        noValidate
        className="space-y-5"
        onSubmit={event =>
          void handleSubmit(values => onReview(toCardStatementInput(values, account, locale)))(
            event,
          )
        }
      >
        <p className="text-body-sm text-ink-muted">{t('anchor.cardIntro')}</p>
        <Field id="anchor-cut" label={t('anchor.cutDate')} error={cutError}>
          <DateInput
            id="anchor-cut"
            max={today}
            invalid={Boolean(cutError)}
            data-autofocus
            {...errorProps('anchor-cut', cutError)}
            {...register('cutDate')}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="anchor-debt" label={t('anchor.totalDebt')} error={debtError}>
            <Controller
              control={control}
              name="totalDebt"
              render={({ field }) => (
                <AmountField
                  id="anchor-debt"
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                  invalid={Boolean(debtError)}
                  {...errorProps('anchor-debt', debtError)}
                />
              )}
            />
          </Field>
          <Field
            id="anchor-limit"
            label={t('anchor.creditLimit')}
            hint={limitRequired ? undefined : t('accounts.optional')}
            error={limitError}
          >
            <Controller
              control={control}
              name="creditLimit"
              render={({ field }) => (
                <AmountField
                  id="anchor-limit"
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                  invalid={Boolean(limitError)}
                  {...errorProps('anchor-limit', limitError)}
                />
              )}
            />
          </Field>
        </div>
        <p className="text-body-sm text-ink-muted">{t('anchor.totalDebtHint')}</p>
      </form>
      <ModalFooter>
        <Button type="submit" form={ANCHOR_FORM_ID} className="ml-auto">
          {t('anchor.review')}
        </Button>
      </ModalFooter>
    </>
  )
}

function BankBalanceForm({ onReview }: { onReview: (input: StatementBalanceInput) => void }) {
  const { t } = useTranslation('settings')
  const { locale } = useFormatters()
  const today = toDateInputValue()
  const schema = useMemo(() => createBankBalanceSchema(locale, today), [locale, today])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BankBalanceValues>({
    resolver: zodResolver(schema),
    defaultValues: bankBalanceDefaults(),
  })
  const errorText = useErrorText()
  const dateError = errorText(errors.date?.message)
  const balanceError = errorText(errors.balance?.message)

  return (
    <>
      <form
        id={ANCHOR_FORM_ID}
        noValidate
        className="space-y-5"
        onSubmit={event =>
          void handleSubmit(values => onReview(toBankBalanceInput(values, locale)))(event)
        }
      >
        <p className="text-body-sm text-ink-muted">{t('anchor.bankIntro')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="anchor-date" label={t('anchor.date')} error={dateError}>
            <DateInput
              id="anchor-date"
              max={today}
              invalid={Boolean(dateError)}
              {...errorProps('anchor-date', dateError)}
              {...register('date')}
            />
          </Field>
          <Field id="anchor-balance" label={t('anchor.balance')} error={balanceError}>
            <Input
              id="anchor-balance"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              invalid={Boolean(balanceError)}
              data-autofocus
              {...errorProps('anchor-balance', balanceError)}
              {...register('balance')}
            />
          </Field>
        </div>
        <p className="text-body-sm text-ink-muted">{t('anchor.balanceHint')}</p>
      </form>
      <ModalFooter>
        <Button type="submit" form={ANCHOR_FORM_ID} className="ml-auto">
          {t('anchor.review')}
        </Button>
      </ModalFooter>
    </>
  )
}

function useLongDate() {
  const { locale } = useFormatters()
  return (dateKey: string) =>
    formatDate(dateKeyToDate(dateKey), { locale, day: 'numeric', month: 'long', year: 'numeric' })
}

/** Plain words on what changes, the balance now and the anchor it becomes. */
function Review({
  account,
  input,
  onBack,
  onDone,
}: {
  account: Account
  input: StatementBalanceInput
  onBack: () => void
  onDone: (result: BalanceAdjustmentResult) => void
}) {
  const { t } = useTranslation('settings')
  const { money } = useFormatters()
  const longDate = useLongDate()
  const anchor = useAnchorToStatement()
  const apiErrorMessages = useApiErrorMessages()
  const preview = anchorPreview(input)
  const card = 'cutDate' in input
  const error = apiErrorMessage(
    anchor.error,
    anchorErrorMessages(apiErrorMessages, {
      validation: t('anchor.saveValidationError'),
      conflict: t('anchor.saveError'),
      unknown: t('anchor.saveError'),
    }),
  )
  const values = {
    name: account.name,
    amount: money(preview.anchorAmount),
    debt: card ? money(input.totalDebt) : '',
    date: longDate(preview.statementDate),
    from: longDate(preview.countsFrom),
  }

  return (
    <section aria-labelledby="anchor-review-title" className="space-y-4">
      <h3 id="anchor-review-title" className="text-body font-medium text-ink">
        {t('anchor.reviewTitle')}
      </h3>
      <ul className="list-disc space-y-2 pl-5 text-body-sm text-ink-muted">
        <li>{t(card ? 'anchor.explainCard' : 'anchor.explainBank', values)}</li>
        <li>{t('anchor.explainFrom', values)}</li>
        <li>{t('anchor.explainHistory')}</li>
        {card && input.creditLimit !== undefined && (
          <li>{t('anchor.explainLimit', { limit: money(input.creditLimit) })}</li>
        )}
        <li>{t('anchor.explainUndo')}</li>
      </ul>
      <dl className="grid grid-cols-2 gap-4 rounded-sm bg-surface-sunken p-4">
        <div>
          <dt className="text-body-sm text-ink-muted">{t('anchor.balanceNow')}</dt>
          <dd>
            <Amount value={account.currentBalance} className="text-body font-medium text-ink" />
          </dd>
        </div>
        <div>
          <dt className="text-body-sm text-ink-muted">{t('anchor.newAnchor', values)}</dt>
          <dd>
            <Amount value={preview.anchorAmount} className="text-body font-medium text-ink" />
          </dd>
        </div>
      </dl>
      <p className="text-body-sm text-ink-muted">{t('anchor.afterHint', values)}</p>
      {error && (
        <p
          role="alert"
          className="rounded-sm bg-negative-soft px-3 py-2.5 text-body-sm text-negative"
        >
          {error}
        </p>
      )}
      <ModalFooter>
        <Button variant="ghost" className="ml-auto" onClick={onBack} disabled={anchor.isPending}>
          {t('anchor.back')}
        </Button>
        <Button
          loading={anchor.isPending}
          onClick={() => anchor.mutate({ id: account.id, input }, { onSuccess: onDone })}
        >
          {t('anchor.confirm')}
        </Button>
      </ModalFooter>
    </section>
  )
}

/** The backend's balance before and after, and an immediate "Deshacer". */
function Done({ result, onClose }: { result: BalanceAdjustmentResult; onClose: () => void }) {
  const { t } = useTranslation('settings')
  const revert = useRevertAdjustment()
  const apiErrorMessages = useApiErrorMessages()
  const pushToast = useToastStore(state => state.push)
  const { adjustment } = result
  const error = apiErrorMessage(revert.error, revertErrorMessages(apiErrorMessages, t))

  return (
    <section aria-live="polite" className="space-y-4">
      <p className="text-body font-medium text-ink">{t('anchor.done')}</p>
      <dl className="grid grid-cols-2 gap-4 rounded-sm bg-surface-sunken p-4">
        <div>
          <dt className="text-body-sm text-ink-muted">{t('anchor.balanceBefore')}</dt>
          <dd>
            <Amount value={adjustment.balanceBefore} className="text-body font-medium text-ink" />
          </dd>
        </div>
        <div>
          <dt className="text-body-sm text-ink-muted">{t('anchor.balanceAfter')}</dt>
          <dd>
            <Amount value={adjustment.balanceAfter} className="text-body font-medium text-ink" />
          </dd>
        </div>
      </dl>
      {error && (
        <p role="alert" className="text-body-sm text-negative">
          {error}
        </p>
      )}
      <ModalFooter>
        <Button
          variant="ghost"
          className="ml-auto"
          loading={revert.isPending}
          onClick={() =>
            revert.mutate(
              { id: adjustment.accountId, adjustmentId: adjustment.id },
              {
                onSuccess: () => {
                  pushToast(t('anchor.undone'))
                  onClose()
                },
              },
            )
          }
        >
          {t('anchor.undo')}
        </Button>
        <Button onClick={onClose}>{t('anchor.close')}</Button>
      </ModalFooter>
    </section>
  )
}

function revertErrorMessages(
  generic: ReturnType<typeof useApiErrorMessages>,
  t: (key: 'anchor.revertConflict' | 'anchor.revertError') => string,
) {
  return anchorErrorMessages(generic, {
    // 409: already undone, or a newer adjustment came after it.
    conflict: t('anchor.revertConflict'),
    validation: t('anchor.revertError'),
    unknown: t('anchor.revertError'),
  })
}

const REASON_KEYS = {
  STATEMENT: 'anchor.reasons.STATEMENT',
  INITIAL_BALANCE: 'anchor.reasons.INITIAL_BALANCE',
  REVERT: 'anchor.reasons.REVERT',
} as const

/** Every anchor change, newest first; "Deshacer" only on the newest one not undone. */
function History({ account }: { account: Account }) {
  const { t } = useTranslation('settings')
  const { shortDate } = useFormatters()
  const longDate = useLongDate()
  const history = useBalanceAdjustments(account.id)
  const revert = useRevertAdjustment()
  const apiErrorMessages = useApiErrorMessages()
  const pushToast = useToastStore(state => state.push)
  const undoable = history.data ? undoableAdjustmentId(history.data) : null
  const error = apiErrorMessage(revert.error, revertErrorMessages(apiErrorMessages, t))

  const label = (item: BalanceAdjustment) =>
    item.reason === 'STATEMENT' && item.statementDate
      ? t(isCardType(account.type) ? 'anchor.historyStatement' : 'anchor.historyBank', {
          date: longDate(item.statementDate),
        })
      : t(REASON_KEYS[item.reason])

  return (
    <section aria-labelledby="anchor-history-title" className="space-y-3">
      <h3 id="anchor-history-title" className="text-body-sm font-medium text-ink-muted">
        {t('anchor.historyTitle')}
      </h3>
      {history.isError ? (
        <SectionError onRetry={() => void history.refetch()} />
      ) : history.isPending ? (
        <Skeleton className="h-10 w-full" />
      ) : history.data.length === 0 ? (
        <p className="text-body-sm text-ink-subtle">{t('anchor.historyEmpty')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {history.data.map(item => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-body-sm text-ink">{label(item)}</p>
                <p className="text-body-sm text-ink-muted">
                  {shortDate(item.createdAt)}
                  {' · '}
                  {t('anchor.historyChange')} <Amount value={item.balanceBefore} /> →{' '}
                  <Amount value={item.balanceAfter} />
                  {item.revertedById && ` · ${t('anchor.historyUndone')}`}
                </p>
              </div>
              {item.id === undoable && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={revert.isPending}
                  onClick={() =>
                    revert.mutate(
                      { id: account.id, adjustmentId: item.id },
                      { onSuccess: () => pushToast(t('anchor.undone')) },
                    )
                  }
                >
                  {t('anchor.undo')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-body-sm text-negative">
          {error}
        </p>
      )}
    </section>
  )
}
