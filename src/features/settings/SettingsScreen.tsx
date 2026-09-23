import { useTranslation } from 'react-i18next'

import { SectionPlaceholder } from '@/components/ui'

export function SettingsScreen() {
  const { t } = useTranslation('layout')

  return <SectionPlaceholder title={t('nav.settings')} />
}
