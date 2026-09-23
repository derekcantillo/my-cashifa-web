import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { IconButton } from '@/components/ui'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

import { NAV_ITEMS } from './navigation'

export const SIDEBAR_ID = 'app-sidebar'

interface SidebarProps {
  /** Only relevant below `lg`, where the sidebar is an off-canvas drawer. */
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation(['layout', 'common'])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <>
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={t('layout:nav.close')}
          onClick={onClose}
          className="fixed inset-0 z-30 bg-overlay/40 lg:hidden"
        />
      )}

      <aside
        id={SIDEBAR_ID}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-border bg-surface-elevated',
          'transition-[translate,visibility] duration-200',
          'lg:visible lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'visible translate-x-0' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <NavLink to={ROUTES.dashboard} onClick={onClose} className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-on-brand"
            >
              C
            </span>
            <span className="font-semibold">{t('common:app.name')}</span>
          </NavLink>
          <IconButton
            label={t('layout:nav.close')}
            icon={X}
            onClick={onClose}
            className="ml-auto lg:hidden"
          />
        </div>

        <nav aria-label={t('layout:nav.label')} className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ id, to, icon: Icon, count }) => (
              <li key={id}>
                <NavLink
                  to={to}
                  end
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand/10 text-brand'
                        : 'text-ink-muted hover:bg-ink/5 hover:text-ink',
                    )
                  }
                >
                  <Icon className="size-[18px] shrink-0" aria-hidden />
                  <span className="flex-1">{t(`layout:nav.${id}`)}</span>
                  {count ? (
                    <span className="min-w-5 rounded-full bg-brand px-1.5 text-center text-xs leading-5 font-medium text-on-brand tabular-nums">
                      <span aria-hidden>{count}</span>
                      <span className="sr-only">{t('layout:nav.unread', { count })}</span>
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
