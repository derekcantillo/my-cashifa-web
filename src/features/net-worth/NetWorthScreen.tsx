import { useTranslation } from 'react-i18next'

import { SectionPlaceholder } from '@/components/ui'

export function NetWorthScreen() {
  const { t } = useTranslation('layout')

  return <SectionPlaceholder title={t('nav.netWorth')} />
}
