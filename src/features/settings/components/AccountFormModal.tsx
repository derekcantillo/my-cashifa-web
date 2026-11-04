import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  AmountField,
  Button,
  DateInput,
  errorProps,
  Field,
  Input,
  Modal,
  ModalFooter,
  SectionError,
  Select,
  Skeleton,
  Switch,
  useModalClose,
  useModalUnsavedChanges,
} from '@/components/ui'
import {
  useAccounts,
  useAnchorToStatement,
  useApiErrorMessages,
  useCreateAccount,
  useCreateInstitution,
  useFormatters,
  useInstitutions,
  useSetInitialBalance,
  useUpdateAccount,
} from '@/hooks'
import { apiErrorMessage } from '@/lib/apiError'
import { toDateInputValue } from '@/lib/format'
import { useAccountModalStore } from '@/store/accountModalStore'
import { useToastStore } from '@/store/toastStore'
import { SELECTABLE_ACCOUNT_TYPES, type Account, type Institution } from '@/types'

import {
  accountFormDefaults,
  canHaveDebitCard,
  createAccountSchema,
  findInstitutionByName,
  initialBalanceOf,
  initialStatementOf,
  isCardType,
  limitNeedsStatement,
  NEW_INSTITUTION,
  toCreateAccountInput,
  toUpdateAccountInput,
  type AccountFormErrorCode,
  type AccountFormValues,
} from '../lib/accountForm'

const ACCOUNT_FORM_ID = 'account-form'
const DAYS = Array.from({ length: 31 }, (_, index) => String(index + 1))

/**
 * Create or edit (`accountId` in the store) a product: type, institution (existing or
 * new), debit card and digits, and for a credit card its limit, cut and payment days and
 * monthly rate. A new card can start from its last statement (anchored right after).
 */
export function AccountFormModal() {
  const { t } = useTranslation('settings')
  const { accountId, close } = useAccountModalStore()
  const accounts = useAccounts()
  const institutions = useInstitutions()
  const account = accountId ? accounts.data?.find(item => item.id === accountId) : undefined

  const loading = (accountId && accounts.isPending) || institutions.isPending
  const failed = (accountId && accounts.isError) || institutions.isError

  return (
    <Modal title={t(accountId ? 'accounts.editTitle' : 'accounts.createTitle')} onClose={close}>
      {failed ? (
        <SectionError
          onRetry={() => {
            void accounts.refetch()
            void institutions.refetch()
          }}
        />
      ) : loading || (accountId && !account) ? (
        <div className="space-y-6" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <AccountFormFields
          account={account}
          institutions={institutions.data ?? []}
          onDone={close}
        />
      )}
    </Modal>
  )
}

function AccountFormFields({
  account,
  institutions,
  onDone,
}: {
  account: Account | undefined
  institutions: readonly Institution[]
  onDone: () => void
}) {
  const { t } = useTranslation(['settings', 'common'])
  const { locale } = useFormatters()
  const requestClose = useModalClose()
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const createInstitution = useCreateInstitution()
  const setInitialBalance = useSetInitialBalance()
  const anchorToStatement = useAnchorToStatement()
  const apiErrorMessages = useApiErrorMessages()
  const pushToast = useToastStore(state => state.push)
  const today = toDateInputValue()
  const schema = useMemo(() => createAccountSchema(locale, today), [locale, today])
  const isEdit = Boolean(account)
  const lockedLimit = limitNeedsStatement(account)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: accountFormDefaults(account, locale),
  })
  useModalUnsavedChanges(isDirty && !isSubmitting)

  const type = useWatch({ control, name: 'type' })
  const institutionChoice = useWatch({ control, name: 'institutionChoice' })
  const hasDebitCard = useWatch({ control, name: 'hasDebitCard' })
  const card = isCardType(type)
  const debitHolder = canHaveDebitCard(type)
  const showDigits = card || (debitHolder && hasDebitCard)
  const typeChangeTouchesCard = Boolean(
    account && account.type !== type && (card || isCardType(account.type)),
  )

  /** The chosen institution id, creating a new one unless the name already exists. */
  const resolveInstitution = async (values: AccountFormValues): Promise<string | null> => {
    if (values.institutionChoice === '') return null
    if (values.institutionChoice !== NEW_INSTITUTION) return values.institutionChoice
    const existing = findInstitutionByName(institutions, values.newInstitutionName)
    if (existing) return existing.id
    return (await createInstitution.mutateAsync(values.newInstitutionName.trim())).id
  }

  const onSubmit = async (values: AccountFormValues) => {
    const institutionId = await resolveInstitution(values)
    if (account) {
      const input = toUpdateAccountInput(values, account, locale, institutionId)
      if (Object.keys(input).length > 0) {
        await updateAccount.mutateAsync({ id: account.id, input })
      }
      pushToast(t('accounts.saved'))
      onDone()
      return
    }

    const created = await createAccount.mutateAsync(
      toCreateAccountInput(values, locale, institutionId),
    )
    // The rest goes after creating it; if it fails the account still exists.
    const statement = initialStatementOf(values, locale)
    const balance = initialBalanceOf(values, locale)
    try {
      if (statement) await anchorToStatement.mutateAsync({ id: created.id, input: statement })
      if (balance !== null) {
        await setInitialBalance.mutateAsync({
          id: created.id,
          input: { amount: balance, date: new Date().toISOString() },
        })
      }
    } catch {
      pushToast(t(statement ? 'accounts.statementError' : 'accounts.balanceError'), 'error')
      onDone()
      return
    }
    pushToast(t('accounts.saved'))
    onDone()
  }

  const errorText = (code: string | undefined) =>
    code ? t(`accounts.errors.${code as AccountFormErrorCode}`) : null
  const fieldErrors = {
    name: errorText(errors.name?.message),
    newInstitutionName: errorText(errors.newInstitutionName?.message),
    cardLast4: errorText(errors.cardLast4?.message),
    initialBalance: errorText(errors.initialBalance?.message),
    creditLimit: errorText(errors.creditLimit?.message),
    statementDay: errorText(errors.statementDay?.message),
    paymentDueDay: errorText(errors.paymentDueDay?.message),
    monthlyRate: errorText(errors.monthlyRate?.message),
    statementCutDate: errorText(errors.statementCutDate?.message),
    statementDebt: errorText(errors.statementDebt?.message),
  }
  const saveError = apiErrorMessage(
    createInstitution.error ?? createAccount.error ?? updateAccount.error,
    {
      ...apiErrorMessages,
      // 409 here can only be an institution name that already exists.
      conflict: t('accounts.institutionExists'),
      validation: t('accounts.saveValidationError'),
      unknown: t('accounts.saveError'),
    },
  )

  return (
    <>
      <form
        id={ACCOUNT_FORM_ID}
        noValidate
        onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
        className="space-y-6"
      >
        {account?.type === 'DEBIT_CARD' && (
          <p className="rounded-sm bg-surface-sunken px-3 py-2.5 text-body-sm text-ink-muted">
            {t('accounts.legacyDebitCard')}
          </p>
        )}

        <Field id="account-name" label={t('accounts.name')} error={fieldErrors.name}>
          <Input
            id="account-name"
            autoComplete="off"
            placeholder={t('accounts.namePlaceholder')}
            invalid={Boolean(fieldErrors.name)}
            data-autofocus
            {...errorProps('account-name', fieldErrors.name)}
            {...register('name')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="account-type"
            label={t('accounts.type')}
            help={typeChangeTouchesCard ? t('accounts.typeChangeHint') : undefined}
          >
            <Select
              id="account-type"
              {...errorProps('account-type', null, typeChangeTouchesCard)}
              {...register('type')}
            >
              {SELECTABLE_ACCOUNT_TYPES.map(value => (
                <option key={value} value={value}>
                  {t(`accounts.types.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="account-institution" label={t('accounts.institution')}>
            <Select id="account-institution" {...register('institutionChoice')}>
              <option value="">{t('accounts.noInstitution')}</option>
              {institutions.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
              <option value={NEW_INSTITUTION}>{t('accounts.newInstitution')}</option>
            </Select>
          </Field>
        </div>

        {institutionChoice === NEW_INSTITUTION && (
          <Field
            id="account-new-institution"
            label={t('accounts.newInstitutionName')}
            error={fieldErrors.newInstitutionName}
          >
            <Input
              id="account-new-institution"
              autoComplete="off"
              placeholder={t('accounts.newInstitutionPlaceholder')}
              invalid={Boolean(fieldErrors.newInstitutionName)}
              {...errorProps('account-new-institution', fieldErrors.newInstitutionName)}
              {...register('newInstitutionName')}
            />
          </Field>
        )}

        {(debitHolder || showDigits) && (
          <div className="grid items-end gap-4 sm:grid-cols-2">
            {debitHolder ? (
              <Controller
                control={control}
                name="hasDebitCard"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    label={t('accounts.hasDebitCard')}
                  />
                )}
              />
            ) : (
              <span aria-hidden />
            )}
            {showDigits && (
              <Field
                id="account-last4"
                label={t(card ? 'accounts.cardLast4' : 'accounts.debitCardLast4')}
                hint={t('accounts.optional')}
                error={fieldErrors.cardLast4}
              >
                <Input
                  id="account-last4"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  placeholder="1234"
                  invalid={Boolean(fieldErrors.cardLast4)}
                  {...errorProps('account-last4', fieldErrors.cardLast4)}
                  {...register('cardLast4')}
                />
              </Field>
            )}
          </div>
        )}

        {card ? (
          <fieldset className="space-y-4">
            <legend className="text-body-sm font-medium text-ink">
              {t('accounts.cardSettings')}
            </legend>
            <Field
              id="account-limit"
              label={t('accounts.creditLimit')}
              error={fieldErrors.creditLimit}
              help={lockedLimit ? t('accounts.limitNeedsStatement') : undefined}
            >
              <Controller
                control={control}
                name="creditLimit"
                render={({ field }) => (
                  <AmountField
                    id="account-limit"
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="0"
                    disabled={lockedLimit}
                    invalid={Boolean(fieldErrors.creditLimit)}
                    {...errorProps('account-limit', fieldErrors.creditLimit, lockedLimit)}
                  />
                )}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="account-statement-day"
                label={t('accounts.statementDay')}
                error={fieldErrors.statementDay}
              >
                <Select id="account-statement-day" {...register('statementDay')}>
                  <option value="">—</option>
                  {DAYS.map(day => (
                    <option key={day} value={day}>
                      {day === '31' ? t('accounts.lastDay') : day}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                id="account-payment-day"
                label={t('accounts.paymentDueDay')}
                error={fieldErrors.paymentDueDay}
              >
                <Select id="account-payment-day" {...register('paymentDueDay')}>
                  <option value="">—</option>
                  {DAYS.map(day => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                id="account-rate"
                label={t('accounts.monthlyRate')}
                hint={t('accounts.optional')}
                error={fieldErrors.monthlyRate}
              >
                <Input
                  id="account-rate"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="2,1155"
                  invalid={Boolean(fieldErrors.monthlyRate)}
                  {...errorProps('account-rate', fieldErrors.monthlyRate)}
                  {...register('monthlyRate')}
                />
              </Field>
            </div>
            <p className="text-body-sm text-ink-muted">{t('accounts.paymentDayHint')}</p>

            {!isEdit && (
              <div className="space-y-4 rounded-sm bg-surface-sunken p-4">
                <p className="text-body-sm text-ink-muted">{t('accounts.lastStatementHint')}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="account-cut-date"
                    label={t('accounts.lastCutDate')}
                    error={fieldErrors.statementCutDate}
                  >
                    <DateInput
                      id="account-cut-date"
                      max={today}
                      invalid={Boolean(fieldErrors.statementCutDate)}
                      {...errorProps('account-cut-date', fieldErrors.statementCutDate)}
                      {...register('statementCutDate')}
                    />
                  </Field>
                  <Field
                    id="account-debt"
                    label={t('accounts.debtAtCut')}
                    error={fieldErrors.statementDebt}
                  >
                    <Controller
                      control={control}
                      name="statementDebt"
                      render={({ field }) => (
                        <AmountField
                          id="account-debt"
                          ref={field.ref}
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="0"
                          invalid={Boolean(fieldErrors.statementDebt)}
                          {...errorProps('account-debt', fieldErrors.statementDebt)}
                        />
                      )}
                    />
                  </Field>
                </div>
              </div>
            )}
          </fieldset>
        ) : (
          !isEdit && (
            <Field
              id="account-balance"
              label={t('accounts.initialBalance')}
              hint={t('accounts.optional')}
              help={t('accounts.initialBalanceHint')}
              error={fieldErrors.initialBalance}
            >
              <Input
                id="account-balance"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                invalid={Boolean(fieldErrors.initialBalance)}
                {...errorProps('account-balance', fieldErrors.initialBalance, true)}
                {...register('initialBalance')}
              />
            </Field>
          )
        )}

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
        <Button variant="ghost" className="ml-auto" onClick={requestClose} disabled={isSubmitting}>
          {t('accounts.cancel')}
        </Button>
        <Button type="submit" form={ACCOUNT_FORM_ID} loading={isSubmitting}>
          {t('common:common.save')}
        </Button>
      </ModalFooter>
    </>
  )
}
