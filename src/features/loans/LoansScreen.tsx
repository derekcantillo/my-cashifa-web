import { useTranslation } from 'react-i18next'

import { SectionPlaceholder } from '@/components/ui'

export function LoansScreen() {
  const { t } = useTranslation('layout')

  return <SectionPlaceholder title={t('nav.loans')} />
}
