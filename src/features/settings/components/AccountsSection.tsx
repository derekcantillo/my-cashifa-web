import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InlineError, Skeleton } from '@/components/ui'
import { useAccounts } from '@/hooks'
import { useAccountModalStore } from '@/store/accountModalStore'

import { AccountRow } from './AccountRow'
import { AddButton, SettingsSection } from './SettingsSection'

export function AccountsSection() {
  const { t } = useTranslation('settings')
  const { data, isPending, isError, refetch } = useAccounts()
  const openModal = useAccountModalStore(state => state.open)
  // One inline panel open at a time.
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <SettingsSection
      id="accounts-title"
      title={t('accounts.title')}
      action={<AddButton label={t('accounts.add')} onClick={openModal} />}
    >
      {isError ? (
        <div className="py-4">
          <InlineError onRetry={() => void refetch()} />
        </div>
      ) : isPending ? (
        <div className="space-y-4 py-4" aria-busy="true">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ) : data.length === 0 ? (
        <p className="py-6 text-ink-muted">{t('accounts.empty')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {data.map(account => (
            <AccountRow
              key={account.id}
              account={account}
              expanded={expandedId === account.id}
              onToggle={() => setExpandedId(id => (id === account.id ? null : account.id))}
            />
          ))}
        </ul>
      )}
    </SettingsSection>
  )
}
