import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { errorProps, Field, inputClassName, Modal } from '@/components/ui'
import { useCreateAccount, useFormatters, useSetInitialBalance } from '@/hooks'
import { parseSignedAmountInput } from '@/lib/format'
import { useAccountModalStore } from '@/store/accountModalStore'
import { useToastStore } from '@/store/toastStore'
import type { AccountType } from '@/types'

const ACCOUNT_TYPES = [
  'DEBIT_CARD',
  'SAVINGS_ACCOUNT',
  'CASH',
  'CREDIT_CARD',
] as const satisfies readonly AccountType[]

type ErrorCode = 'nameRequired' | 'nameTooLong' | 'amountRequired' | 'amountInvalid'

/** Create-only (the backend has no edit/delete for accounts). */
export function AccountFormModal() {
  const { t } = useTranslation(['settings', 'common'])
  const { locale } = useFormatters()
  const close = useAccountModalStore(state => state.close)
  const createAccount = useCreateAccount()
  const setInitialBalance = useSetInitialBalance()
  const pushToast = useToastStore(state => state.push)

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, { error: 'nameRequired' }).max(80, { error: 'nameTooLong' }),
        // Required by CreateAccountDto.
        type: z.enum(ACCOUNT_TYPES),
        initialBalance: z
          .string()
          .trim()
          .min(1, { error: 'amountRequired' })
          .refine(value => !Number.isNaN(parseSignedAmountInput(value, locale)), {
            error: 'amountInvalid',
          }),
      }),
    [locale],
  )
  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', type: 'DEBIT_CARD', initialBalance: '0' },
  })

  const onSubmit = async (values: FormValues) => {
    const account = await createAccount.mutateAsync({ name: values.name, type: values.type })
    // POST /accounts takes no balance: it's set afterwards, as of now.
    const amount = parseSignedAmountInput(values.initialBalance, locale)
    if (amount !== 0) {
      try {
        await setInitialBalance.mutateAsync({
          id: account.id,
          input: { amount, date: new Date().toISOString() },
        })
      } catch {
        pushToast(t('accounts.balanceError'), 'error')
        close()
        return
      }
    }
    pushToast(t('accounts.saved'))
    close()
  }

  const errorText = (code: string | undefined) =>
    code ? t(`accounts.errors.${code as ErrorCode}`) : null
  const nameError = errorText(errors.name?.message)
  const balanceError = errorText(errors.initialBalance?.message)

  return (
    <Modal title={t('accounts.createTitle')} onClose={close}>
      <form
        noValidate
        onSubmit={event => void handleSubmit(onSubmit)(event).catch(() => undefined)}
        className="space-y-5"
      >
        <Field id="account-name" label={t('accounts.name')} error={nameError}>
          <input
            id="account-name"
            type="text"
            autoComplete="off"
            placeholder={t('accounts.namePlaceholder')}
            className={inputClassName(nameError)}
            {...errorProps('account-name', nameError)}
            {...register('name')}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="account-type" label={t('accounts.type')}>
            <select id="account-type" className={inputClassName(null)} {...register('type')}>
              {ACCOUNT_TYPES.map(type => (
                <option key={type} value={type}>
                  {t(`accounts.types.${type}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="account-balance" label={t('accounts.initialBalance')} error={balanceError}>
            <input
              id="account-balance"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className={inputClassName(balanceError)}
              {...errorProps('account-balance', balanceError)}
              {...register('initialBalance')}
            />
          </Field>
        </div>

        {createAccount.isError && (
          <p role="alert" className="text-sm text-danger">
            {t('accounts.saveError')}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t('common:common.saving') : t('common:common.save')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
