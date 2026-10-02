import { useTranslation } from 'react-i18next'

import { Modal, SectionError, Skeleton } from '@/components/ui'
import { useGoals } from '@/hooks'
import { useGoalModalStore } from '@/store/goalModalStore'

import { ContributionModal } from './ContributionModal'
import { GoalForm } from './GoalForm'

/**
 * Mounted once in AppShell while the store says it's open: create / edit a goal, or
 * contribute to one. Edit reads the goal from the list (GET /goals includes everything).
 */
export function GoalFormModal() {
  const { t } = useTranslation('goals')
  const { mode, goalId, close } = useGoalModalStore()
  const { data: goals, isPending, isError, refetch } = useGoals()

  if (mode === 'contribute') return <ContributionModal />

  const isEdit = mode === 'edit'
  const goal = isEdit ? goals?.find(item => item.id === goalId) : undefined

  return (
    <Modal title={isEdit ? t('form.editTitle') : t('form.createTitle')} onClose={close}>
      {!isEdit ? (
        <GoalForm onDone={close} />
      ) : isError ? (
        <SectionError message={t('form.loadError')} onRetry={() => void refetch()} />
      ) : isPending ? (
        <div className="space-y-5" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : goal ? (
        <GoalForm goal={goal} onDone={close} />
      ) : (
        <p className="text-body text-ink-muted">{t('form.loadError')}</p>
      )}
    </Modal>
  )
}
