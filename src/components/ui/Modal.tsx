import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { IconButton } from './IconButton'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Native `<dialog>` opened with `showModal()`: focus trapping, Escape and the top
 * layer come for free. Mount it only while open — it opens on mount.
 * Closes on Escape, backdrop click or the X button, all through `onClose`.
 */
export function Modal({ title, onClose, children }: ModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    // A click on the <dialog> element itself (not its content) is a click on the backdrop.
    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose()
    }
    dialog.addEventListener('click', onBackdropClick)
    return () => {
      dialog.removeEventListener('click', onBackdropClick)
      dialog.close()
    }
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-0 text-ink backdrop:bg-overlay/50"
    >
      <div className="p-6">
        <header className="mb-6 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <IconButton label={t('common.close')} icon={X} onClick={onClose} className="-mr-2" />
        </header>
        {children}
      </div>
    </dialog>
  )
}
