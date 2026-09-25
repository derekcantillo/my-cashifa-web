import { useTranslation } from 'react-i18next'

import { AccountsSection } from './components/AccountsSection'
import { BudgetRulesSection } from './components/BudgetRulesSection'
import { RecurringExpensesSection } from './components/RecurringExpensesSection'
import { SavingsTargetSection } from './components/SavingsTargetSection'

export function SettingsPage() {
  const { t } = useTranslation('settings')

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <AccountsSection />
      <RecurringExpensesSection />
      <BudgetRulesSection />
      <SavingsTargetSection />
    </div>
  )
}
