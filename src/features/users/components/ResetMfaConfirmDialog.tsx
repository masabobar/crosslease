import { ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ResetMfaConfirmDialogProps = {
  open: boolean
  name: string
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
  /** Prefix for the cancel/confirm test ids, so each host surface stays addressable. */
  testIdPrefix?: string
}

export function ResetMfaConfirmDialog({
  open,
  name,
  isPending,
  onClose,
  onConfirm,
  testIdPrefix = "mfa-reset",
}: ResetMfaConfirmDialogProps) {
  const { t } = useTranslation("users")

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[420px] gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle>{t("actions.resetMfa.title", { name })}</DialogTitle>
        </DialogHeader>
        <div className="px-4 py-4">
          <Alert variant="warning" className="rounded-[10px] px-[10px]">
            <ShieldAlert />
            <AlertDescription>
              {t("actions.resetMfa.description", { name })}
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter className="mx-0 mb-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-testid={`${testIdPrefix}-cancel`}
          >
            {t("modal.actions.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-testid={`${testIdPrefix}-confirm`}
          >
            {t("actions.resetMfa.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
