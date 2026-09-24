import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { DeleteConfirmation, IconButton } from '@/components/ui'
import { useDeleteGoal } from '@/hooks'
import { ROUTES } from '@/lib/routes'
import { useToastStore } from '@/store/toastStore'

/** Trash icon that opens the two-step delete as a small popover. */
export function DeleteGoalPopover({ goalId }: { goalId: string }) {
  const { t } = useTranslation('goals')
  const navigate = useNavigate()
  const deleteGoal = useDeleteGoal()
  const pushToast = useToastStore(state => state.push)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const onConfirm = async () => {
    await deleteGoal.mutateAsync(goalId)
    pushToast(t('toast.deleted'))
    navigate(ROUTES.goals, { replace: true })
  }

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        label={t('detail.delete')}
        icon={Trash2}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      />
      {open && (
        <DeleteConfirmation
          title={t('form.deleteConfirm')}
          isPending={deleteGoal.isPending}
          error={deleteGoal.isError ? t('form.deleteError') : null}
          onConfirm={() => void onConfirm().catch(() => undefined)}
          onCancel={() => setOpen(false)}
          className="absolute top-full right-0 z-20 mt-2 w-72 bg-surface-elevated shadow-lg"
        />
      )}
    </div>
  )
}
