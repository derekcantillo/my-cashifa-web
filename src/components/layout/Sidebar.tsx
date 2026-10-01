import { useQueryClient } from '@tanstack/react-query'
import { LogOut, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'

import { useApiKeyStore } from '@/api'
import { Eyebrow, IconButton } from '@/components/ui'
import { useUnreadAlertsCount } from '@/hooks'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'

import { LanguageSwitcher } from './LanguageSwitcher'
import { MAIN_NAV_ITEMS, SETTINGS_NAV_ITEM, type NavItem } from './navigation'
import { ThemeSwitcher } from './ThemeSwitcher'

export const SIDEBAR_ID = 'app-sidebar'

interface SidebarProps {
  /** Only relevant below `lg`, where the sidebar is an off-canvas drawer. */
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearApiKey = useApiKeyStore(state => state.clearApiKey)
  // `undefined` until the first response: no badge flashes a "0" while loading.
  const { data: unreadAlerts } = useUnreadAlertsCount()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const logout = () => {
    clearApiKey()
    // Drop anything cached with the previous key.
    queryClient.clear()
    navigate(ROUTES.setup, { replace: true })
  }

  return (
    <>
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={t('nav.close')}
          onClick={onClose}
          className="fixed inset-0 z-30 bg-overlay/40 lg:hidden"
        />
      )}

      <aside
        id={SIDEBAR_ID}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col border-r border-line bg-canvas',
          'transition-[translate,visibility] duration-200 ease-tactile',
          'lg:visible lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'visible translate-x-0' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex items-start gap-2 px-6 pt-7 pb-8">
          <NavLink to={ROUTES.dashboard} onClick={onClose} className="block rounded-sm">
            <span className="block font-serif text-[30px] leading-none text-ink">
              {t('app.name')}
            </span>
            <Eyebrow as="span" className="mt-2 block">
              {t('app.tagline')}
            </Eyebrow>
          </NavLink>
          <IconButton
            label={t('nav.close')}
            icon={X}
            size="sm"
            onClick={onClose}
            className="-mt-1 ml-auto lg:hidden"
          />
        </div>

        <nav aria-label={t('nav.label')} className="flex-1 overflow-y-auto px-4">
          <ul className="space-y-1">
            {MAIN_NAV_ITEMS.map(item => (
              <li key={item.id}>
                <SidebarLink
                  item={item}
                  count={item.showsUnreadAlerts ? unreadAlerts : undefined}
                  onNavigate={onClose}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-4 px-4 pt-4 pb-5">
          <div className="flex items-center gap-2">
            <ThemeSwitcher className="flex-1" />
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-1 border-t border-line pt-4">
            <SidebarLink item={SETTINGS_NAV_ITEM} onNavigate={onClose} className="flex-1" />
            <IconButton label={t('actions.logout')} icon={LogOut} onClick={logout} />
          </div>
        </div>
      </aside>
    </>
  )
}

interface SidebarLinkProps {
  item: NavItem
  /** Unread badge; hidden when 0 or unknown. */
  count?: number
  onNavigate: () => void
  className?: string
}

function SidebarLink({ item, count, onNavigate, className }: SidebarLinkProps) {
  const { t } = useTranslation()
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      // Detail pages (/metas/:id) keep their section highlighted; only Home needs an exact match.
      end={item.to === ROUTES.dashboard}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex h-10 items-center gap-3 rounded-md px-3 text-body font-medium transition-tactile',
          isActive
            ? 'bg-accent text-accent-ink shadow-raised'
            : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
          className,
        )
      }
    >
      <Icon className="size-[18px] shrink-0" aria-hidden />
      <span className="flex-1 truncate">{t(`nav.${item.id}`)}</span>
      {count ? (
        <span
          className={cn(
            'min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold tabular-nums',
            'bg-accent text-accent-ink group-aria-[current=page]:bg-accent-ink group-aria-[current=page]:text-accent',
          )}
        >
          <span aria-hidden>{count}</span>
          <span className="sr-only">{t('nav.unread', { count })}</span>
        </span>
      ) : null}
    </NavLink>
  )
}
