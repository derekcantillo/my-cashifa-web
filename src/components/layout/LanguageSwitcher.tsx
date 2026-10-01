import { useTranslation } from 'react-i18next'

import { SegmentedControl, type SegmentedOption } from '@/components/ui'
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n'

function isLanguage(value: string | undefined): value is Language {
  return (SUPPORTED_LANGUAGES as readonly (string | undefined)[]).includes(value)
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const current = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'es'

  const options: SegmentedOption<Language>[] = SUPPORTED_LANGUAGES.map(language => ({
    value: language,
    label: language.toUpperCase(),
    ariaLabel: t(`language.${language}`),
  }))

  return (
    <SegmentedControl
      label={t('language.label')}
      value={current}
      options={options}
      onChange={language => void i18n.changeLanguage(language)}
      size="sm"
      className={className}
    />
  )
}
