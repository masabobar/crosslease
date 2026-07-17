import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { useRejectPartner } from "@/features/partners/hooks/useRejectPartner"
import { ApiError } from "@/lib/api"
import type { PartnerStatus } from "@/features/partners/api/schema"

// Rejection is terminal — note is mandatory (min 10 chars, per BE contract).
const rejectSchema = z.object({
  note: z.string().min(10).max(2000),
})
type RejectForm = z.infer<typeof rejectSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  partnerName: string
  partnerStatus: PartnerStatus
}

function RejectPartnerDialog({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  partnerStatus,
}: Props) {
  const { t } = useTranslation("partners")
  const mutation = useRejectPartner(partnerId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { note: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: RejectForm) {
    mutation.mutate(
      { note: values.note },
      {
        onSuccess: () => {
          toast.success(t("rejectDialog.success"))
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
            <DialogTitle>{t("rejectDialog.title")}</DialogTitle>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="reject-note">
                {t("rejectDialog.fields.note")}
              </Label>
              <span className="text-xs text-muted-foreground">
                {t("rejectDialog.fields.noteMinChars")}
              </span>
            </div>
            <Textarea
              id="reject-note"
              data-testid="reject-partner-note"
              placeholder={t("rejectDialog.fields.notePlaceholder")}
              rows={4}
              {...register("note")}
            />
            {errors.note && (
              <p className="text-xs text-destructive" role="alert">
                {t("rejectDialog.errors.noteTooShort")}
              </p>
            )}
          </div>

          <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-destructive/10">
            <TriangleAlert
              size={16}
              className="text-destructive shrink-0 mt-0.5"
            />
            <p className="text-sm text-destructive/80">
              {t("rejectDialog.description")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-testid="reject-partner-cancel"
          >
            {t("rejectDialog.cancel")}
          </Button>
          <Button
            type="submit"
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
            disabled={mutation.isPending}
            data-testid="reject-partner-submit"
          >
            {mutation.isPending
              ? t("rejectDialog.submitting")
              : t("rejectDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { RejectPartnerDialog }
