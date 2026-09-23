import { useQueryClient } from '@tanstack/react-query'
import { CircleUser, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useApiKeyStore } from '@/api'
import { IconButton, SegmentedControl, type SegmentedOption } from '@/components/ui'
import type { Language } from '@/i18n'
import { ROUTES } from '@/lib/routes'
import { useTheme, type Theme } from '@/theme'

export function AccountMenu() {
  const { t, i18n } = useTranslation('layout')
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearApiKey = useApiKeyStore(state => state.clearApiKey)

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const themeOptions: SegmentedOption<Theme>[] = [
    { value: 'light', label: t('account.themeLight'), icon: Sun },
    { value: 'dark', label: t('account.themeDark'), icon: Moon },
    { value: 'auto', label: t('account.themeAuto'), icon: Monitor },
  ]

  const languageOptions: SegmentedOption<Language>[] = [
    { value: 'es', label: 'ES', ariaLabel: 'Español' },
    { value: 'en', label: 'EN', ariaLabel: 'English' },
  ]

  const logout = () => {
    setOpen(false)
    clearApiKey()
    // Drop anything cached with the previous key.
    queryClient.clear()
    navigate(ROUTES.setup, { replace: true })
  }

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        ref={triggerRef}
        label={t('account.menu')}
        icon={CircleUser}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(value => !value)}
      />

      {open && (
        <div
          id={panelId}
          className="absolute top-full right-0 z-30 mt-2 w-72 space-y-5 rounded-xl border border-border bg-surface-elevated p-4 shadow-lg"
        >
          <div className="space-y-2">
            <p className="text-sm text-ink-muted">{t('account.theme')}</p>
            <SegmentedControl
              label={t('account.theme')}
              value={theme}
              options={themeOptions}
              onChange={setTheme}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-ink-muted">{t('account.language')}</p>
            <SegmentedControl
              label={t('account.language')}
              value={(i18n.resolvedLanguage ?? 'es') as Language}
              options={languageOptions}
              onChange={language => void i18n.changeLanguage(language)}
            />
          </div>

          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <LogOut className="size-4" aria-hidden />
              {t('account.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
