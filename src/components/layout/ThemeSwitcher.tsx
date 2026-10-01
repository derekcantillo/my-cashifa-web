import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SegmentedControl, type SegmentedOption } from '@/components/ui'
import { useTheme, type Theme } from '@/theme'

interface ThemeSwitcherProps {
  /** Icons only (sidebar) or icons with labels. */
  compact?: boolean
  className?: string
}

export function ThemeSwitcher({ compact = true, className }: ThemeSwitcherProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const options: SegmentedOption<Theme>[] = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'system', label: t('theme.system'), icon: Monitor },
  ]

  return (
    <SegmentedControl
      label={t('theme.label')}
      value={theme}
      options={options}
      onChange={setTheme}
      size="sm"
      iconOnly={compact}
      className={className}
    />
  )
}
