import { useTranslation } from 'react-i18next'

import { SectionPlaceholder } from '@/components/ui'

export function TransactionsScreen() {
  const { t } = useTranslation('layout')

  return <SectionPlaceholder title={t('nav.transactions')} />
}
