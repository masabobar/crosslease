import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ShieldAlert, TriangleAlert } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { useArchivePartner } from "@/features/partners/hooks/useArchivePartner"
import {
  fetchArchiveEligibility,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import type { PartnerStatus } from "@/features/partners/api/schema"

const archiveSchema = z.object({
  reason: z.string().min(20),
  irreversibility_acknowledgement: z.boolean().refine(v => v === true),
})
type ArchiveForm = z.infer<typeof archiveSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  partnerName: string
  partnerStatus: PartnerStatus
}

function ArchivePartnerDialog({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  partnerStatus,
}: Props) {
  const { t } = useTranslation("partners")
  const mutation = useArchivePartner(partnerId)

  const {
    data: eligibility,
    isLoading: isEligibilityLoading,
    isError: isEligibilityError,
  } = useQuery({
    queryKey: PARTNERS_QUERY_KEYS.archiveEligibility(partnerId),
    queryFn: () => fetchArchiveEligibility(partnerId),
    enabled: open,
  })

  const requiresFourEyes = eligibility?.requires_counter_confirmation ?? false

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    getValues,
    formState: { errors },
  } = useForm<ArchiveForm>({
    resolver: zodResolver(archiveSchema),
    defaultValues: { reason: "", irreversibility_acknowledgement: false },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: ArchiveForm) {
    mutation.mutate(
      { reason: values.reason },
      {
        onSuccess: result => {
          if (result.is_immediate) {
            toast.success(t("archiveDialog.successImmediate"))
          } else {
            toast.info(t("archiveDialog.successPendingApproval"))
          }
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
      title={t("archiveDialog.title")}
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
      justificationFieldId="archive-reason"
      justificationLabel={t("archiveDialog.fields.reason")}
      justificationMinCharsLabel={t("archiveDialog.fields.reasonMinChars")}
      justificationHint={t("archiveDialog.fields.reasonHint")}
      justificationErrorMessage={
        errors.reason ? t("archiveDialog.errors.reasonTooShort") : undefined
      }
      justificationRegister={register("reason")}
      justificationPlaceholder={t("archiveDialog.fields.reasonPlaceholder")}
      justificationRows={4}
      extraContent={
        <>
          <label className="flex items-center gap-2 cursor-pointer">
            <Controller
              control={control}
              name="irreversibility_acknowledgement"
              render={({ field }) => (
                <Checkbox
                  data-testid="archive-irreversibility-ack"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <span className="text-sm text-foreground leading-snug">
              {t("archiveDialog.fields.irreversibilityAck.prefix")}
              <strong>
                {t("archiveDialog.fields.irreversibilityAck.emphasis")}
              </strong>
              {t("archiveDialog.fields.irreversibilityAck.suffix")}
            </span>
          </label>

          {requiresFourEyes && (
            <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-amber-500/10">
              <ShieldAlert
                size={16}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <p className="text-sm text-amber-600">
                {t("archiveDialog.fourEyesNote")}
              </p>
            </div>
          )}

          {isEligibilityError && (
            <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-destructive/10">
              <TriangleAlert
                size={16}
                className="text-destructive shrink-0 mt-0.5"
              />
              <p className="text-sm text-destructive/80">
                {t("errors.generic")}
              </p>
            </div>
          )}

          <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-destructive/10">
            <TriangleAlert
              size={16}
              className="text-destructive shrink-0 mt-0.5"
            />
            <p className="text-sm text-destructive/80">
              {t("archiveDialog.description")}
            </p>
          </div>
        </>
      }
      onCancel={handleClose}
      isActionDisabled={
        mutation.isPending || isEligibilityLoading || isEligibilityError
      }
      isPending={mutation.isPending}
      cancelLabel={t("archiveDialog.cancel")}
      cancelTestId="archive-cancel"
      submitLabel={t("archiveDialog.submit")}
      submittingLabel={t("archiveDialog.submitting")}
      submitTestId="archive-submit"
      submitButtonClassName="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
    />
  )
}

export { ArchivePartnerDialog }
