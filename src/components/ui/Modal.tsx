import { X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'

import { Button } from './Button'
import { IconButton } from './IconButton'

const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/** Nested modals share one body scroll lock. */
let scrollLocks = 0
let restoreScroll: (() => void) | null = null

function lockScroll(): () => void {
  if (scrollLocks++ === 0) {
    const root = document.documentElement
    const scrollbar = window.innerWidth - root.clientWidth
    const previous = { overflow: root.style.overflow, paddingRight: root.style.paddingRight }
    root.style.overflow = 'hidden'
    // Keep the layout from shifting where scrollbars take space.
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`
    restoreScroll = () => {
      root.style.overflow = previous.overflow
      root.style.paddingRight = previous.paddingRight
    }
  }
  return () => {
    if (--scrollLocks === 0) restoreScroll?.()
  }
}

interface ModalContextValue {
  footer: HTMLElement | null
  /** Same path as Esc / the X: asks first when there are unsaved changes. */
  requestClose: () => void
  setHasUnsavedChanges: (value: boolean) => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

/**
 * Renders its children in the enclosing Modal's pinned footer. Lets a form inside the
 * body own its actions (a submit button outside the `<form>` uses `form="<form id>"`).
 */
export function ModalFooter({ children }: { children: ReactNode }) {
  const context = useContext(ModalContext)
  return context?.footer ? createPortal(children, context.footer) : null
}

/** Makes the enclosing Modal ask before discarding while `hasChanges` is true. */
export function useModalUnsavedChanges(hasChanges: boolean): void {
  const setHasUnsavedChanges = useContext(ModalContext)?.setHasUnsavedChanges
  useEffect(() => {
    setHasUnsavedChanges?.(hasChanges)
    return () => setHasUnsavedChanges?.(false)
  }, [hasChanges, setHasUnsavedChanges])
}

/** `requestClose` of the enclosing Modal (for a "Cancel" button). */
export function useModalClose(): () => void {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModalClose must be used inside a Modal')
  return context.requestClose
}

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Pinned under the scrolling body (actions). Submit buttons can use `form="<form id>"`. */
  footer?: ReactNode
  /** `md` 520px (forms), `sm` 400px (confirmations). */
  size?: 'sm' | 'md'
  /** Esc, backdrop and the X ask before discarding (unsaved changes). */
  confirmClose?: boolean
}

/**
 * Native `<dialog>` opened with `showModal()`: top layer, inert page behind (focus stays
 * inside), Esc handling. On top of that: initial focus on the first field (or an element
 * marked `data-autofocus`), focus restored on close, body scroll locked, backdrop click
 * closes, and a bottom sheet below 640px. Mount it only while open — it opens on mount.
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
  size = 'md',
  confirmClose = false,
}: ModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [footerElement, setFooterElement] = useState<HTMLElement | null>(null)
  const footerRef = useRef<HTMLElement | null>(null)
  const [childHasChanges, setChildHasChanges] = useState(false)
  const titleId = useId()
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  // Latest values for the native listeners, which are attached once.
  const onCloseRef = useRef(onClose)
  const confirmCloseRef = useRef(confirmClose)
  useEffect(() => {
    onCloseRef.current = onClose
    confirmCloseRef.current = confirmClose || childHasChanges
  })

  const requestClose = useCallback(() => {
    if (confirmCloseRef.current) setConfirmingDiscard(true)
    else onCloseRef.current()
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previouslyFocused = document.activeElement
    const unlockScroll = lockScroll()
    dialog.showModal()

    const preferred =
      bodyRef.current?.querySelector<HTMLElement>('[data-autofocus]') ??
      bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      // Confirmations have no fields: start on the first (safe) action.
      footerRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    preferred?.focus()

    // A click whose press and release both land on the <dialog> itself (not its
    // content) is a click on the backdrop. Tracking the press avoids closing when a
    // text selection drag ends outside the panel.
    let pressedOnBackdrop = false
    const onPointerDown = (event: PointerEvent) => {
      pressedOnBackdrop = event.target === dialog
    }
    const onClick = (event: MouseEvent) => {
      if (pressedOnBackdrop && event.target === dialog) requestClose()
      pressedOnBackdrop = false
    }
    // Browsers may close a dialog without a `cancel` event (Chrome skips it on a second
    // Esc with no user activation in between). Keep React in sync with the DOM.
    // `close` is dispatched async: ignore the one from a cleanup that was followed by
    // a re-open (StrictMode remount) — the dialog is open again by then.
    const onNativeClose = () => {
      if (!dialog.open) onCloseRef.current()
    }
    dialog.addEventListener('pointerdown', onPointerDown)
    dialog.addEventListener('click', onClick)
    dialog.addEventListener('close', onNativeClose)

    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown)
      dialog.removeEventListener('click', onClick)
      dialog.removeEventListener('close', onNativeClose)
      dialog.close()
      unlockScroll()
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus()
      }
    }
  }, [requestClose])

  const context: ModalContextValue = {
    footer: footerElement,
    requestClose,
    setHasUnsavedChanges: setChildHasChanges,
  }

  return (
    <ModalContext.Provider value={context}>
      <dialog
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby={titleId}
        // Esc handled here rather than through `cancel`: Chrome skips `cancel` for an Esc
        // with no user activation since the last one (e.g. Esc that opened the discard
        // confirmation, then Esc again). The innermost modal handles it and stops it.
        onKeyDown={event => {
          if (event.key !== 'Escape' || event.defaultPrevented) return
          event.preventDefault()
          event.stopPropagation()
          requestClose()
        }}
        onCancel={event => {
          // Esc: go through the same path as the X (may ask to discard).
          event.preventDefault()
          requestClose()
        }}
        className={cn(
          'm-auto flex-col overflow-hidden bg-surface-raised p-0 text-ink shadow-floating open:flex',
          'w-[calc(100%-2rem)] rounded-card backdrop:bg-overlay/45',
          size === 'sm' ? 'max-w-[400px]' : 'max-w-[520px]',
          'max-h-[calc(100dvh-4rem)] motion-safe:animate-dialog-in',
          // Bottom sheet on phones.
          'max-sm:mb-0 max-sm:max-h-[92dvh] max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none',
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 px-6 pt-5 pb-4">
          <h2 id={titleId} className="text-title text-ink">
            {title}
          </h2>
          <IconButton label={t('common.close')} icon={X} onClick={requestClose} className="-mr-2" />
        </header>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>

        {/* Always mounted (hidden while empty) so `ModalFooter` can portal into it. */}
        <footer
          ref={node => {
            footerRef.current = node
            setFooterElement(node)
          }}
          className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-6 py-4 empty:hidden"
        >
          {footer}
        </footer>

        {confirmingDiscard && (
          <Modal
            size="sm"
            title={t('discard.title')}
            onClose={() => setConfirmingDiscard(false)}
            footer={
              <>
                <Button
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => setConfirmingDiscard(false)}
                >
                  {t('discard.keepEditing')}
                </Button>
                <Button variant="danger" onClick={() => onCloseRef.current()}>
                  {t('discard.confirm')}
                </Button>
              </>
            }
          >
            <p className="text-body text-ink-muted">{t('discard.body')}</p>
          </Modal>
        )}
      </dialog>
    </ModalContext.Provider>
  )
}
