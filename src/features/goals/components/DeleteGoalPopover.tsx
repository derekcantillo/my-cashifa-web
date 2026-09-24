import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { ConfirmDeletePopover } from '@/components/ui'
import { useDeleteGoal } from '@/hooks'
import { ROUTES } from '@/lib/routes'
import { useToastStore } from '@/store/toastStore'

export function DeleteGoalPopover({ goalId }: { goalId: string }) {
  const { t } = useTranslation('goals')
  const navigate = useNavigate()
  const deleteGoal = useDeleteGoal()
  const pushToast = useToastStore(state => state.push)

  const onConfirm = async () => {
    await deleteGoal.mutateAsync(goalId)
    pushToast(t('toast.deleted'))
    navigate(ROUTES.goals, { replace: true })
  }

  return (
    <ConfirmDeletePopover
      label={t('detail.delete')}
      title={t('form.deleteConfirm')}
      isPending={deleteGoal.isPending}
      error={deleteGoal.isError ? t('form.deleteError') : null}
      onConfirm={() => void onConfirm().catch(() => undefined)}
    />
  )
}
