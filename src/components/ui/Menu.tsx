import type { LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import { cn } from '@/lib/cn'

import { IconButton } from './IconButton'

export interface MenuItem {
  id: string
  label: string
  icon?: LucideIcon
  /** Destructive action: negative tone. */
  danger?: boolean
  disabled?: boolean
  onSelect: () => void
}

interface MenuProps {
  /** Accessible name of the trigger ("Más acciones"). */
  label: string
  icon: LucideIcon
  items: readonly MenuItem[]
  className?: string
}

/**
 * Icon button that opens a small floating menu (`role="menu"`). Keyboard: Enter, Space
 * or ↓ open it on the first item, ↑/↓/Home/End move, Esc or Tab close it, Esc returns
 * focus to the trigger. Clicking outside closes it.
 */
export function Menu({ label, icon, items, className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const menuId = useId()

  const enabled = items.map((item, index) => (item.disabled ? -1 : index)).filter(i => i >= 0)
  const focusItem = (index: number) => itemRefs.current[index]?.focus()

  useEffect(() => {
    if (!open) return
    focusItem(enabled[0] ?? 0)
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
    // Only when it opens: focus the first enabled item once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = itemRefs.current.findIndex(item => item === document.activeElement)
    const position = enabled.indexOf(current)
    const move = (to: number) => {
      event.preventDefault()
      focusItem(enabled[(to + enabled.length) % enabled.length])
    }
    if (event.key === 'ArrowDown') move(position + 1)
    else if (event.key === 'ArrowUp') move(position - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(enabled.length - 1)
    else if (event.key === 'Escape') {
      // Don't let an enclosing modal or page handler see this Esc.
      event.preventDefault()
      event.stopPropagation()
      close(true)
    } else if (event.key === 'Tab') close(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <IconButton
        ref={triggerRef}
        label={label}
        icon={icon}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(value => !value)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
          }
        }}
      />
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="absolute top-full right-0 z-30 mt-1.5 min-w-44 rounded-md bg-surface-raised p-1 shadow-floating motion-safe:animate-dialog-in"
        >
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                ref={node => {
                  itemRefs.current[index] = node
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled}
                onClick={() => {
                  close(false)
                  item.onSelect()
                }}
                className={cn(
                  'flex h-9 w-full items-center gap-2.5 rounded-sm px-2.5 text-left text-body transition-tactile',
                  'focus-visible:outline-none focus:bg-surface-sunken disabled:opacity-45',
                  item.danger
                    ? 'text-negative hover:bg-negative-soft focus:bg-negative-soft'
                    : 'text-ink hover:bg-surface-sunken',
                )}
              >
                {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
