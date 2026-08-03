import { ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type EmailChangeConfirmDialogProps = {
  open: boolean
  currentEmail: string
  newEmail: string
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Four-Eyes confirmation shown before an admin submits a user's email change. */
export function EmailChangeConfirmDialog({
  open,
  currentEmail,
  newEmail,
  isPending,
  onCancel,
  onConfirm,
}: EmailChangeConfirmDialogProps) {
  const { t } = useTranslation("users")

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onCancel()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[480px] gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle>
            {t("detail.page.editIdentity.confirm.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 py-4 flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("detail.page.editIdentity.confirm.currentEmail")}
              </span>
              <span className="text-foreground">{currentEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("detail.page.editIdentity.confirm.newEmail")}
              </span>
              <span className="text-foreground font-semibold">{newEmail}</span>
            </div>
          </div>
          <Alert variant="warning" className="rounded-[10px] px-[10px]">
            <ShieldAlert />
            <AlertTitle>
              {t("detail.page.editIdentity.confirm.warning.title")}
            </AlertTitle>
            <AlertDescription>
              {t("detail.page.editIdentity.confirm.warning.description")}
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter className="mx-0 mb-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            data-testid="email-change-cancel"
          >
            {t("detail.page.editIdentity.confirm.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            data-testid="email-change-confirm"
          >
            {t("detail.page.editIdentity.confirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
