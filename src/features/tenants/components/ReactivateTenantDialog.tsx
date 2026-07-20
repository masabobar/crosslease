import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Info } from "lucide-react"
import { toast } from "sonner"
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog"
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { useReactivateTenant } from "@/features/tenants/hooks/useReactivateTenant"
import { ReactivateTenantFormSchema } from "@/features/tenants/api/schema"
import type {
  ReactivateTenantForm,
  TenantStatus,
} from "@/features/tenants/api/schema"
import { ApiError } from "@/lib/api"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName: string
  tenantStatus: TenantStatus
}

export function ReactivateTenantDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  tenantStatus,
}: Props) {
  const { t } = useTranslation("tenants")
  const mutation = useReactivateTenant(tenantId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReactivateTenantForm>({
    resolver: zodResolver(ReactivateTenantFormSchema),
    defaultValues: { justification: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: ReactivateTenantForm) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.info(t("detail.reactivateDialog.successToast.title"), {
          description: t("detail.reactivateDialog.successToast.description", {
            tenantName,
          }),
        })
        handleClose()
      },
      onError: err => {
        toast.error(
          err instanceof ApiError
            ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")
        )
      },
    })
  }

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit(onSubmit)}
      title={t("detail.reactivateDialog.title")}
      infoRows={
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {t("detail.reactivateDialog.info.tenant")}
            </span>
            <span className="text-foreground font-medium">{tenantName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {t("detail.reactivateDialog.info.currentStatus")}
            </span>
            <TenantStatusBadge status={tenantStatus} />
          </div>
        </>
      }
      justificationFieldId="reactivate-justification"
      justificationLabel={t("detail.reactivateDialog.fields.justification")}
      justificationMinCharsLabel={t(
        "detail.reactivateDialog.fields.justificationMinChars"
      )}
      justificationHint={t("detail.reactivateDialog.fields.justificationHint")}
      justificationErrorMessage={
        errors.justification
          ? t("detail.reactivateDialog.errors.justificationTooShort")
          : undefined
      }
      justificationRegister={register("justification")}
      justificationPlaceholder={t(
        "detail.reactivateDialog.fields.justificationPlaceholder"
      )}
      justificationRows={4}
      extraContent={
        <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-sky-500/10">
          <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-sky-700">
              {t("detail.reactivateDialog.alert.title")}
            </p>
            <p className="text-sm text-sky-600/80">
              {t("detail.reactivateDialog.alert.description")}
            </p>
          </div>
        </div>
      }
      onCancel={handleClose}
      isActionDisabled={isSubmitting || mutation.isPending}
      isPending={mutation.isPending}
      cancelLabel={t("detail.reactivateDialog.cancel")}
      cancelTestId="reactivate-cancel"
      submitLabel={t("detail.reactivateDialog.submit")}
      submittingLabel={t("detail.reactivateDialog.submitting")}
      submitTestId="reactivate-submit"
    />
  )
}
