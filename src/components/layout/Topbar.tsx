import { Bell, Menu, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Button, IconButton, iconButtonClassName } from '@/components/ui'
import { useUnreadAlertsCount } from '@/hooks'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'

import { PAGE_GUTTER } from './PageContainer'
import { PeriodSelector } from './PeriodSelector'
import { SIDEBAR_ID } from './Sidebar'

function useIsScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return scrolled
}

interface TopbarProps {
  navOpen: boolean
  onOpenNav: () => void
  onRegisterExpense: () => void
}

export function Topbar({ navOpen, onOpenNav, onRegisterExpense }: TopbarProps) {
  const { t } = useTranslation()
  const scrolled = useIsScrolled()
  // `undefined` while loading: no dot until the real count arrives.
  const { data: unreadAlerts = 0 } = useUnreadAlertsCount()
  const hasUnreadAlerts = unreadAlerts > 0

  return (
    // Hairline only once content scrolls under it; no blur, just the canvas.
    <header
      className={cn(
        'sticky top-0 z-20 border-b bg-canvas transition-tactile',
        scrolled ? 'border-line' : 'border-transparent',
      )}
    >
      <div className={cn(PAGE_GUTTER, 'flex h-16 items-center gap-2')}>
        <IconButton
          label={t('nav.open')}
          icon={Menu}
          aria-expanded={navOpen}
          aria-controls={SIDEBAR_ID}
          onClick={onOpenNav}
          className="-ml-2 lg:hidden"
        />

        <PeriodSelector />

        <div className="ml-auto flex items-center gap-2">
          <Link
            to={ROUTES.alerts}
            aria-label={
              hasUnreadAlerts
                ? t('actions.alertsUnread', { count: unreadAlerts })
                : t('actions.alerts')
            }
            className={iconButtonClassName()}
          >
            <Bell className="size-[18px]" aria-hidden />
            {hasUnreadAlerts && (
              <span
                aria-hidden
                className="absolute top-2 right-2.5 size-2 rounded-full bg-accent ring-2 ring-canvas"
              />
            )}
          </Link>

          <Button icon={Plus} onClick={onRegisterExpense}>
            <span className="sr-only sm:not-sr-only">{t('actions.registerExpense')}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
