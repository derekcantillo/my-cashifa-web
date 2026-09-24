import { useTranslation } from 'react-i18next'

import { InlineError, Modal, Skeleton } from '@/components/ui'
import { useGoal } from '@/hooks'
import { useGoalModalStore } from '@/store/goalModalStore'

import { GoalForm } from './GoalForm'

/** Mounted once in AppLayout while the store says it's open. */
export function GoalFormModal() {
  const { t } = useTranslation('goals')
  const { mode, goalId, close } = useGoalModalStore()
  const isEdit = mode === 'edit'
  const { data: goal, isPending, isError, refetch } = useGoal(isEdit ? goalId : undefined)

  return (
    <Modal title={isEdit ? t('form.editTitle') : t('form.createTitle')} onClose={close}>
      {!isEdit ? (
        <GoalForm onDone={close} />
      ) : isError ? (
        <div className="space-y-2">
          <p className="text-ink-muted">{t('form.loadError')}</p>
          <InlineError onRetry={() => void refetch()} />
        </div>
      ) : isPending ? (
        <div className="space-y-5" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <GoalForm goal={goal} onDone={close} />
      )}
    </Modal>
  )
}
