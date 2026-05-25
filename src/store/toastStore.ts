import { create } from "zustand"
import { toast as sonnerToast } from "sonner"
import type { ExternalToast } from "sonner"

export type ToastVariant = "warning" | "success"

type ToastPayload = {
  variant: ToastVariant
  title: string
  message: string
  actionLabel?: string
}

type ToastState = {
  showToast: (payload: ToastPayload) => void
  dismissToast: () => void
}

let _activeId: string | number | null = null

export const useToastStore = create<ToastState>(() => ({
  showToast: ({ variant, title, message, actionLabel }: ToastPayload) => {
    if (_activeId !== null) sonnerToast.dismiss(_activeId)

    const opts: ExternalToast = {
      description: message,
      ...(actionLabel
        ? { action: { label: actionLabel, onClick: () => {} } }
        : {}),
    }

    _activeId =
      variant === "success"
        ? sonnerToast.success(title, opts)
        : sonnerToast.warning(title, opts)
  },
  dismissToast: () => {
    if (_activeId !== null) {
      sonnerToast.dismiss(_activeId)
      _activeId = null
    }
  },
}))
