import { CircleAlert, CircleCheck, X } from "lucide-react"
import { useToastStore } from "@/store/toastStore"
import { cn } from "@/lib/utils"

export function Toast() {
  const toast = useToastStore(s => s.toast)
  const dismissToast = useToastStore(s => s.dismissToast)

  if (!toast) return null

  const isWarning = toast.variant === "warning"

  return (
    <div className="fixed top-4 right-4 z-50 w-[576px]">
      <div
        className={cn(
          "flex items-start gap-2 rounded-xl border p-2 bg-card shadow-lg",
          isWarning ? "border-warning" : "border-success"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center rounded-md p-1",
            isWarning ? "bg-warning/10" : "bg-success/10"
          )}
        >
          {isWarning ? (
            <CircleAlert size={16} className="text-warning" />
          ) : (
            <CircleCheck size={16} className="text-success" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 justify-center">
          <p className="text-sm font-medium text-foreground">{toast.title}</p>
          <p className="text-sm text-muted-foreground/80">{toast.message}</p>
        </div>

        {toast.actionLabel && (
          <button
            type="button"
            className={cn(
              "shrink-0 rounded-[10px] border px-2 py-1 text-xs font-medium",
              isWarning
                ? "border-warning text-warning"
                : "border-success text-success"
            )}
          >
            {toast.actionLabel}
          </button>
        )}

        <button
          type="button"
          onClick={dismissToast}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
