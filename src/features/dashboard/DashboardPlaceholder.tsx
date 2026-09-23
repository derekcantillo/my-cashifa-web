import { useTranslation } from 'react-i18next'

/** Temporary home screen until the dashboard is built (Block 2). */
export function DashboardPlaceholder() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <h1 className="text-2xl font-semibold">{t('common.comingSoon', { name: 'Dashboard' })}</h1>
    </main>
  )
}
