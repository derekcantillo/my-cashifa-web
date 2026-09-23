import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { isUnauthorizedError, useApiKeyStore, validateApiKey } from '@/api'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const apiKeySchema = z.object({
  apiKey: z.string().trim().min(1),
})

type ApiKeyFormValues = z.infer<typeof apiKeySchema>

type SubmitError = 'invalidKey' | 'unreachable'

export function ApiKeySetupScreen() {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const setApiKey = useApiKeyStore(state => state.setApiKey)
  const clearApiKey = useApiKeyStore(state => state.clearApiKey)
  const [submitError, setSubmitError] = useState<SubmitError | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: { apiKey: '' },
  })

  const onSubmit = async ({ apiKey }: ApiKeyFormValues) => {
    setSubmitError(null)
    setApiKey(apiKey)
    try {
      await validateApiKey()
      navigate(ROUTES.dashboard, { replace: true })
    } catch (error) {
      clearApiKey()
      setSubmitError(isUnauthorizedError(error) ? 'invalidKey' : 'unreachable')
    }
  }

  const fieldError = errors.apiKey ? t('auth:setup.errors.required') : null

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-surface-elevated p-8"
      >
        <header className="space-y-2">
          <p className="text-sm font-medium text-brand">{t('common:app.name')}</p>
          <h1 className="text-xl font-semibold">{t('auth:setup.title')}</h1>
          <p className="text-sm text-ink-muted">{t('auth:setup.description')}</p>
        </header>

        <div className="space-y-2">
          <label htmlFor="apiKey" className="block text-sm font-medium">
            {t('auth:setup.apiKeyLabel')}
          </label>
          <input
            id="apiKey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={t('auth:setup.apiKeyPlaceholder')}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? 'apiKey-error' : undefined}
            className={cn(
              'w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none transition',
              'focus:ring-2 focus:ring-brand/30',
              fieldError ? 'border-danger focus:border-danger' : 'border-border focus:border-brand',
            )}
            {...register('apiKey')}
          />
          {fieldError && (
            <p id="apiKey-error" className="text-sm text-danger">
              {fieldError}
            </p>
          )}
        </div>

        {submitError && (
          <div
            role="alert"
            className="space-y-1 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            <p className="font-medium">{t('common:common.error')}</p>
            <p>{t(`auth:setup.errors.${submitError}`)}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? t('common:common.loading')
            : submitError === 'unreachable'
              ? t('common:common.retry')
              : t('common:common.save')}
        </button>
      </form>
    </main>
  )
}
