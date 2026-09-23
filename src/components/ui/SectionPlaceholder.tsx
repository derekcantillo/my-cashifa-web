import { useTranslation } from 'react-i18next'

interface SectionPlaceholderProps {
  title: string
}

/** Temporary content for sections that are not built yet. */
export function SectionPlaceholder({ title }: SectionPlaceholderProps) {
  const { t } = useTranslation()

  return (
    <section>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-ink-muted">{t('common.underConstruction')}</p>
    </section>
  )
}
