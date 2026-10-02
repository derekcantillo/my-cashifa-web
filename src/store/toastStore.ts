import { create } from 'zustand'

export type ToastVariant = 'success' | 'error'

export interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

/** Older toasts are dropped beyond this many. */
export const MAX_VISIBLE_TOASTS = 3
/** Auto-dismiss delay; paused while the toast is hovered or focused (see ToastContainer). */
export const TOAST_DURATION_MS = 4000

interface ToastState {
  toasts: Toast[]
  push: (message: string, variant?: ToastVariant) => number
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>()(set => ({
  toasts: [],
  push: (message, variant = 'success') => {
    const id = nextId++
    set(state => ({
      toasts: [...state.toasts, { id, message, variant }].slice(-MAX_VISIBLE_TOASTS),
    }))
    return id
  },
  dismiss: id => set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
}))
