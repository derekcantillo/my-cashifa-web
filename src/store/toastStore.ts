import { create } from 'zustand'

export type ToastVariant = 'success' | 'error'

export interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

const AUTO_DISMISS_MS = 3500

interface ToastState {
  toasts: Toast[]
  push: (message: string, variant?: ToastVariant) => number
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message, variant = 'success') => {
    const id = nextId++
    set(state => ({ toasts: [...state.toasts, { id, message, variant }] }))
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS)
    return id
  },
  dismiss: id => set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
}))
