import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'
import { TOAST_DURATION_MS, useToastStore, type Toast } from '@/store/toastStore'

/**
 * Mounted once in AppShell: bottom-centered stack, newest last. Successes are announced
 * politely (`role="status"`), errors assertively (`role="alert"`).
 */
export function ToastContainer() {
  const toasts = useToastStore(state => state.toasts)

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:bottom-6">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useTranslation()
  const dismiss = useToastStore(state => state.dismiss)
  const [paused, setPaused] = useState(false)
  const remaining = useRef(TOAST_DURATION_MS)

  // Counts down only while not hovered/focused; resumes with the time that was left.
  useEffect(() => {
    if (paused) return
    const startedAt = Date.now()
    const timer = window.setTimeout(() => dismiss(toast.id), remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current -= Date.now() - startedAt
    }
  }, [paused, dismiss, toast.id])

  const isError = toast.variant === 'error'
  const Icon = isError ? CircleAlert : CircleCheck

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md bg-surface-raised py-2.5 pr-2 pl-4 text-body text-ink shadow-floating',
        'motion-safe:animate-toast-in',
      )}
    >
      <Icon
        aria-hidden
        className={cn('size-[18px] shrink-0', isError ? 'text-negative' : 'text-ink-muted')}
      />
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label={t('common.close')}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-tactile hover:bg-surface-sunken hover:text-ink"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}
