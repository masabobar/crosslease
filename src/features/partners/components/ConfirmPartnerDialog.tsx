import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { useConfirmPartner } from "@/features/partners/hooks/useConfirmPartner"
import { ApiError } from "@/lib/api"
import type { PartnerStatus } from "@/features/partners/api/schema"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  partnerName: string
  partnerStatus: PartnerStatus
}

type FormValues = { note: string }

function ConfirmPartnerDialog({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  partnerStatus,
}: Props) {
  const { t } = useTranslation("partners")
  const mutation = useConfirmPartner(partnerId)
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { note: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: FormValues) {
    mutation.mutate(
      { note: values.note || null },
      {
        onSuccess: () => {
          toast.success(t("confirmDialog.success"))
          handleClose()
        },
        onError: err => {
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic")
          )
        },
      }
    )
  }

  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("confirmDialog.title")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Partner</span>
            <span className="font-medium text-foreground">{partnerName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <PartnerStatusBadge status={partnerStatus} />
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-note">
              {t("confirmDialog.fields.note")}
            </Label>
            <Textarea
              id="confirm-note"
              data-testid="confirm-note"
              rows={3}
              {...register("note")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-testid="confirm-cancel"
          >
            {t("confirmDialog.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="confirm-submit"
          >
            {mutation.isPending
              ? t("confirmDialog.submitting")
              : t("confirmDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { ConfirmPartnerDialog }
