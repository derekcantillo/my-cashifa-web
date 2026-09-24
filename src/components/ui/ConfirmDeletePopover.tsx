import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { DeleteConfirmation } from './DeleteConfirmation'
import { IconButton } from './IconButton'

interface ConfirmDeletePopoverProps {
  /** Accessible name of the trash icon, e.g. "Eliminar meta". */
  label: string
  /** Question shown in the confirmation, e.g. "¿Eliminar esta meta?". */
  title: string
  isPending: boolean
  error?: string | null
  disabled?: boolean
  onConfirm: () => void
}

/** Trash icon that opens the two-step delete confirmation as a small popover. */
export function ConfirmDeletePopover({
  label,
  title,
  isPending,
  error,
  disabled = false,
  onConfirm,
}: ConfirmDeletePopoverProps) {
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

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        label={label}
        icon={Trash2}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(value => !value)}
      />
      {open && !disabled && (
        <DeleteConfirmation
          title={title}
          isPending={isPending}
          error={error}
          onConfirm={onConfirm}
          onCancel={() => setOpen(false)}
          className="absolute top-full right-0 z-20 mt-2 w-72 bg-surface-elevated shadow-lg"
        />
      )}
    </div>
  )
}
