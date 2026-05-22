import { Dialog } from "@base-ui/react/dialog"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type DialogModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

function DialogModal({ open, onOpenChange, children }: DialogModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 bg-black/50 z-40",
            "transition-opacity duration-200",
            "data-[open]:opacity-100",
            "data-[closed]:opacity-0",
            "data-[starting-style]:opacity-0"
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "bg-white rounded-2xl shadow-xl",
            "w-full max-w-[560px] max-h-[90vh] overflow-y-auto",
            "transition-all duration-200",
            "data-[open]:opacity-100 data-[open]:scale-100",
            "data-[closed]:opacity-0 data-[closed]:scale-95",
            "data-[starting-style]:opacity-0 data-[starting-style]:scale-95"
          )}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { DialogModal }
