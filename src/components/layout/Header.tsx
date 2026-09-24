import { Bell, Menu, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { IconButton, iconButtonClassName } from '@/components/ui'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useTransactionModalStore } from '@/store/transactionModalStore'

import { AccountMenu } from './AccountMenu'
import { CONTENT_GUTTER } from './layoutStyles'
import { MOCK_UNREAD_ALERTS } from './navigation'
import { PeriodSelector } from './PeriodSelector'
import { SIDEBAR_ID } from './Sidebar'

interface HeaderProps {
  navOpen: boolean
  onOpenNav: () => void
}

export function Header({ navOpen, onOpenNav }: HeaderProps) {
  const { t } = useTranslation('layout')
  const hasUnreadAlerts = MOCK_UNREAD_ALERTS > 0
  const openTransactionModal = useTransactionModalStore(state => state.open)

  return (
    <header
      className={cn(
        CONTENT_GUTTER,
        'sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-surface',
      )}
    >
      <IconButton
        label={t('nav.open')}
        icon={Menu}
        aria-expanded={navOpen}
        aria-controls={SIDEBAR_ID}
        onClick={onOpenNav}
        className="-ml-2 lg:hidden"
      />

      <PeriodSelector />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => openTransactionModal('create')}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-2.5 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover sm:px-3.5"
        >
          <Plus className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">{t('header.newMovement')}</span>
        </button>

        <Link
          to={ROUTES.alerts}
          aria-label={
            hasUnreadAlerts
              ? t('header.alertsUnread', { count: MOCK_UNREAD_ALERTS })
              : t('header.alerts')
          }
          className={iconButtonClassName}
        >
          <Bell className="size-5" aria-hidden />
          {hasUnreadAlerts && (
            <span
              aria-hidden
              className="absolute top-2 right-2 size-2 rounded-full bg-danger ring-2 ring-surface"
            />
          )}
        </Link>

        <AccountMenu />
      </div>
    </header>
  )
}
