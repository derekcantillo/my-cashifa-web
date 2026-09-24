import { useTranslation } from 'react-i18next'

interface InlineErrorProps {
  onRetry: () => void
}

export function InlineError({ onRetry }: InlineErrorProps) {
  const { t } = useTranslation()

  return (
    <p role="alert" className="text-sm text-ink-muted">
      {t('common.error')}.{' '}
      <button
        type="button"
        onClick={onRetry}
        className="font-medium text-brand underline-offset-4 hover:underline"
      >
        {t('common.retry')}
      </button>
    </p>
  )
}
