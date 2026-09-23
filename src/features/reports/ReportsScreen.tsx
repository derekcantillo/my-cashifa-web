import { useTranslation } from 'react-i18next'

import { SectionPlaceholder } from '@/components/ui'

export function ReportsScreen() {
  const { t } = useTranslation('layout')

  return <SectionPlaceholder title={t('nav.reports')} />
}
