import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { ApiErrorMessages } from '@/lib/apiError'

/**
 * Generic translated message per API error kind. Each flow spreads it and replaces the
 * kinds it can explain better (e.g. what a 400 means in that form).
 */
export function useApiErrorMessages(): ApiErrorMessages {
  const { t } = useTranslation()
  return useMemo(
    () => ({
      conflict: t('apiErrors.conflict'),
      validation: t('apiErrors.validation'),
      notFound: t('apiErrors.notFound'),
      unknown: t('apiErrors.unknown'),
    }),
    [t],
  )
}
