import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { TriangleAlert } from "lucide-react"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { useRejectPartner } from "@/features/partners/hooks/useRejectPartner"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import type { PartnerStatus } from "@/features/partners/api/schema"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

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
    setError,
    getValues,
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
          if (
            applyApiFieldErrors({
              error: err,
              fields: Object.keys(getValues()),
              setError,
            })
          )
            return

          toast.error(resolveApiErrorMessage(err, t))
        },
      }
    )
  }

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit(onSubmit)}
      title={t("rejectDialog.title")}
      infoRows={
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("list.table.columns.name")}
            </span>
            <span className="font-medium text-foreground">{partnerName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("list.table.columns.status")}
            </span>
            <PartnerStatusBadge status={partnerStatus} />
          </div>
        </>
      }
      justificationFieldId="reject-partner-note"
      justificationLabel={t("rejectDialog.fields.note")}
      justificationMinCharsLabel={t("rejectDialog.fields.noteMinChars")}
      justificationHint={t("rejectDialog.fields.noteHint")}
      justificationErrorMessage={
        errors.note ? t("rejectDialog.errors.noteTooShort") : undefined
      }
      justificationRegister={register("note")}
      justificationPlaceholder={t("rejectDialog.fields.notePlaceholder")}
      justificationRows={4}
      extraContent={
        <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-destructive/10">
          <TriangleAlert
            size={16}
            className="text-destructive shrink-0 mt-0.5"
          />
          <p className="text-sm text-destructive/80">
            {t("rejectDialog.description")}
          </p>
        </div>
      }
      onCancel={handleClose}
      isActionDisabled={mutation.isPending}
      isPending={mutation.isPending}
      cancelLabel={t("rejectDialog.cancel")}
      cancelTestId="reject-partner-cancel"
      submitLabel={t("rejectDialog.submit")}
      submittingLabel={t("rejectDialog.submitting")}
      submitTestId="reject-partner-submit"
      submitButtonClassName="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
    />
  )
}

export { RejectPartnerDialog }
