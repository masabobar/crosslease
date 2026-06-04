import { create } from "zustand"
import { toast as sonnerToast } from "sonner"
import type { ExternalToast } from "sonner"

export type ToastVariant = "default" | "info" | "success" | "warning" | "error"

type ToastPayload = {
  variant: ToastVariant
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

type ToastState = {
  showToast: (payload: ToastPayload) => void
  dismissToast: () => void
}

let _activeId: string | number | null = null

function dispatchToast(
  variant: ToastVariant,
  title: string,
  opts: ExternalToast
): string | number {
  if (variant === "info") return sonnerToast.info(title, opts)
  if (variant === "success") return sonnerToast.success(title, opts)
  if (variant === "warning") return sonnerToast.warning(title, opts)
  if (variant === "error") return sonnerToast.error(title, opts)
  return sonnerToast(title, opts)
}

export const useToastStore = create<ToastState>(() => ({
  showToast: ({
    variant,
    title,
    message,
    actionLabel,
    onAction,
  }: ToastPayload) => {
    if (_activeId !== null) sonnerToast.dismiss(_activeId)

    const opts: ExternalToast = {
      description: message,
      ...(actionLabel
        ? { action: { label: actionLabel, onClick: () => onAction?.() } }
        : {}),
    }

    _activeId = dispatchToast(variant, title, opts)
  },
  dismissToast: () => {
    if (_activeId !== null) {
      sonnerToast.dismiss(_activeId)
      _activeId = null
    }
  },
}))
