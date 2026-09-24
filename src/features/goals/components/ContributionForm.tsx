import { useTranslation } from 'react-i18next'

import { AmountEntryForm } from '@/components/ui'
import { useCreateGoalContribution } from '@/hooks'
import { useToastStore } from '@/store/toastStore'

interface ContributionFormProps {
  goalId: string
  onDone: () => void
}

/** Inline panel under the hero. Past dates are allowed (`contributedAt` is retroactive). */
export function ContributionForm({ goalId, onDone }: ContributionFormProps) {
  const { t } = useTranslation('goals')
  const contribute = useCreateGoalContribution()
  const pushToast = useToastStore(state => state.push)

  return (
    <AmountEntryForm
      idPrefix="contribution"
      submitLabel={t('contribution.save')}
      errorMessage={contribute.isError ? t('contribution.saveError') : null}
      onCancel={onDone}
      onSubmit={async ({ amount, date, note }) => {
        await contribute.mutateAsync({
          id: goalId,
          input: { amount, contributedAt: date, ...(note ? { note } : {}) },
        })
        pushToast(t('toast.contributed'))
        onDone()
      }}
    />
  )
}
