import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InlineError, Skeleton } from '@/components/ui'
import { useFormatters, useSettings, useUpdateSettings } from '@/hooks'
import { useToastStore } from '@/store/toastStore'

import { SettingsSection } from './SettingsSection'

export function SavingsTargetSection() {
  const { t } = useTranslation('settings')
  const { data, isPending, isError, refetch } = useSettings()

  return (
    <SettingsSection
      id="savings-title"
      title={t('savings.title')}
      description={t('savings.description')}
    >
      {isError ? (
        <div className="py-4">
          <InlineError onRetry={() => void refetch()} />
        </div>
      ) : isPending ? (
        <div className="py-5" aria-busy="true">
          <Skeleton className="h-5 w-full" />
        </div>
      ) : (
        <SavingsTargetForm saved={data.targetSavingsPercentage} />
      )}
    </SettingsSection>
  )
}

function SavingsTargetForm({ saved }: { saved: number }) {
  const { t } = useTranslation(['settings', 'common'])
  const { locale } = useFormatters()
  const updateSettings = useUpdateSettings()
  const pushToast = useToastStore(state => state.push)
  const [value, setValue] = useState(Math.round(saved))
  // Compared against the saved value from useSettings(): Save only shows when it differs.
  const changed = value !== Math.round(saved)
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })

  const save = () =>
    updateSettings.mutate(
      { targetSavingsPercentage: value },
      { onSuccess: () => pushToast(t('settings:savings.saved')) },
    )

  return (
    <div className="space-y-3 py-5">
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={event => setValue(Number(event.target.value))}
          aria-label={t('settings:savings.label')}
          aria-valuetext={percent.format(value / 100)}
          className="flex-1 accent-brand"
        />
        <output className="w-14 text-right text-lg font-semibold tabular-nums">
          {percent.format(value / 100)}
        </output>
        {changed && (
          <button
            type="button"
            onClick={save}
            disabled={updateSettings.isPending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {updateSettings.isPending ? t('common:common.saving') : t('settings:savings.save')}
          </button>
        )}
      </div>
      {updateSettings.isError && (
        <p role="alert" className="text-sm text-danger">
          {t('settings:savings.saveError')}
        </p>
      )}
    </div>
  )
}
