import { create } from "zustand"

export type ToastVariant = "warning" | "success"

type ToastPayload = {
  variant: ToastVariant
  title: string
  message: string
  actionLabel?: string
}

type ToastState = {
  toast: ToastPayload | null
  showToast: (payload: ToastPayload) => void
  dismissToast: () => void
}

let _timer: ReturnType<typeof setTimeout> | null = null

export const useToastStore = create<ToastState>(set => ({
  toast: null,
  showToast: payload => {
    if (_timer) clearTimeout(_timer)
    set({ toast: payload })
    _timer = setTimeout(() => {
      set({ toast: null })
      _timer = null
    }, 5000)
  },
  dismissToast: () => {
    if (_timer) {
      clearTimeout(_timer)
      _timer = null
    }
    set({ toast: null })
  },
}))
