import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { useConfirmPartner } from "@/features/partners/hooks/useConfirmPartner"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import type { PartnerStatus } from "@/features/partners/api/schema"

// Single-actor FO confirmation per US 13.5 (PRD1042-1449): no BO approval.
const confirmSchema = z.object({
  note: z.string().max(2000).optional(),
})
type ConfirmForm = z.infer<typeof confirmSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  partnerName: string
  partnerStatus: PartnerStatus
}

function ConfirmPartnerDialog({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  partnerStatus,
}: Props) {
  const { t } = useTranslation("partners")
  const mutation = useConfirmPartner(partnerId)

  const {
    setError,
    getValues,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfirmForm>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { note: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: ConfirmForm) {
    mutation.mutate(
      { note: values.note?.trim() ? values.note : null },
      {
        onSuccess: () => {
          toast.success(t("confirmDialog.success"))
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
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit(onSubmit)}
      title={t("confirmDialog.title")}
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
          <p className="text-sm text-muted-foreground">
            {t("confirmDialog.description")}
          </p>
        </>
      }
      justificationFieldId="confirm-partner-note"
      justificationLabel={t("confirmDialog.fields.note")}
      justificationMinCharsLabel=""
      justificationHint={t("confirmDialog.fields.noteHint")}
      justificationErrorMessage={
        errors.note ? t("confirmDialog.errors.noteTooLong") : undefined
      }
      justificationRegister={register("note")}
      justificationPlaceholder={t("confirmDialog.fields.notePlaceholder")}
      justificationRows={3}
      onCancel={handleClose}
      isActionDisabled={mutation.isPending}
      isPending={mutation.isPending}
      cancelLabel={t("confirmDialog.cancel")}
      cancelTestId="confirm-partner-cancel"
      submitLabel={t("confirmDialog.submit")}
      submittingLabel={t("confirmDialog.submitting")}
      submitTestId="confirm-partner-submit"
    />
  )
}

export { ConfirmPartnerDialog }
