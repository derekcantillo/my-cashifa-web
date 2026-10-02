import { useTranslation } from 'react-i18next'

import { ConfirmDeleteDialog } from '@/components/ui'
import { useDeleteGoal, useFormatters } from '@/hooks'
import { useToastStore } from '@/store/toastStore'
import type { Goal } from '@/types'

interface DeleteGoalDialogProps {
  goal: Goal
  onCancel: () => void
  onDeleted: () => void
}

/**
 * DELETE /goals/:id always succeeds: contributions go with the goal (FK cascade) and
 * the backend recalculates the periods they fell in, which get that money back as
 * available. The dialog says exactly that.
 */
export function DeleteGoalDialog({ goal, onCancel, onDeleted }: DeleteGoalDialogProps) {
  const { t } = useTranslation('goals')
  const { money } = useFormatters()
  const deleteGoal = useDeleteGoal()
  const pushToast = useToastStore(state => state.push)
  const contributed = goal.contributions.reduce((sum, item) => sum + item.amount, 0)

  return (
    <ConfirmDeleteDialog
      title={t('delete.title')}
      confirmLabel={t('delete.confirm')}
      isPending={deleteGoal.isPending}
      error={deleteGoal.isError ? t('delete.error') : null}
      onCancel={onCancel}
      onConfirm={() =>
        deleteGoal.mutate(goal.id, {
          onSuccess: () => {
            pushToast(t('toast.deleted'))
            onDeleted()
          },
        })
      }
    >
      <p>{t('delete.body', { name: goal.name, saved: money(goal.currentAmount) })}</p>
      {goal.contributions.length > 0 && (
        <p>
          {t('delete.contributions', {
            count: goal.contributions.length,
            amount: money(contributed),
          })}
        </p>
      )}
    </ConfirmDeleteDialog>
  )
}
