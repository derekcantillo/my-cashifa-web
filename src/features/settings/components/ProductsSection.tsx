import { useTranslation } from 'react-i18next'

import { InlineError, Skeleton } from '@/components/ui'
import { useAccounts, useFormatters, useInstitutions } from '@/hooks'
import { useAccountModalStore } from '@/store/accountModalStore'

import { groupProducts } from '../lib/products'
import { InstitutionHeader } from './InstitutionHeader'
import { ProductRow } from './ProductRow'
import { AddButton, SettingsSection } from './SettingsSection'

/** "Mis productos": accounts, wallets and cards grouped by institution, "Sin entidad" last. */
export function ProductsSection() {
  const { t } = useTranslation('settings')
  const { locale } = useFormatters()
  const accounts = useAccounts()
  const institutions = useInstitutions()
  const openModal = useAccountModalStore(state => state.open)

  const isError = accounts.isError || institutions.isError
  const isPending = accounts.isPending || institutions.isPending
  const groups =
    accounts.data && institutions.data
      ? groupProducts(accounts.data, institutions.data, locale)
      : []

  return (
    <SettingsSection
      id="products-title"
      title={t('products.title')}
      description={t('products.description')}
      action={<AddButton label={t('products.add')} onClick={() => openModal()} />}
    >
      {isError ? (
        <div className="py-4">
          <InlineError
            onRetry={() => {
              void accounts.refetch()
              void institutions.refetch()
            }}
          />
        </div>
      ) : isPending ? (
        <div className="space-y-4 py-4" aria-busy="true">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ) : groups.length === 0 ? (
        <p className="py-6 text-ink-muted">{t('products.empty')}</p>
      ) : (
        <div className="divide-y divide-border">
          {groups.map(group => (
            <section
              key={group.id ?? 'none'}
              aria-label={group.name ?? t('products.noInstitution')}
            >
              <InstitutionHeader group={group} />
              {group.accounts.length === 0 ? (
                <p className="py-3 text-body-sm text-ink-subtle">{t('products.noProducts')}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {group.accounts.map(account => (
                    <ProductRow key={account.id} account={account} />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </SettingsSection>
  )
}
