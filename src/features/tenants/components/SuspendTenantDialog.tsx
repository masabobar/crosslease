import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { useSuspendTenant } from "@/features/tenants/hooks/useSuspendTenant"
import { SuspendTenantFormSchema } from "@/features/tenants/api/schema"
import type {
  SuspendTenantForm,
  TenantStatus,
} from "@/features/tenants/api/schema"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName: string
  tenantStatus: TenantStatus
}

export function SuspendTenantDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  tenantStatus,
}: Props) {
  const { t } = useTranslation("tenants")
  const mutation = useSuspendTenant(tenantId)

  const {
    setError,
    getValues,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SuspendTenantForm>({
    resolver: zodResolver(SuspendTenantFormSchema),
    defaultValues: { justification: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: SuspendTenantForm) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.info(t("detail.suspendDialog.successToast.title"), {
          description: t("detail.suspendDialog.successToast.description", {
            tenantName,
          }),
        })
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
    })
  }

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit(onSubmit)}
      title={t("detail.suspendDialog.title")}
      infoRows={
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {t("detail.suspendDialog.info.tenant")}
            </span>
            <span className="text-foreground font-medium">{tenantName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {t("detail.suspendDialog.info.currentStatus")}
            </span>
            <TenantStatusBadge status={tenantStatus} />
          </div>
        </>
      }
      justificationFieldId="suspend-justification"
      justificationLabel={t("detail.suspendDialog.fields.justification")}
      justificationMinCharsLabel={t(
        "detail.suspendDialog.fields.justificationMinChars"
      )}
      justificationHint={t("detail.suspendDialog.fields.justificationHint")}
      justificationErrorMessage={
        errors.justification
          ? t("detail.suspendDialog.errors.justificationTooShort")
          : undefined
      }
      justificationRegister={register("justification")}
      justificationPlaceholder={t(
        "detail.suspendDialog.fields.justificationPlaceholder"
      )}
      justificationRows={4}
      extraContent={
        <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-amber-500/10">
          <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-amber-600">
              {t("detail.suspendDialog.alert.title")}
            </p>
            <p className="text-sm text-amber-600/80">
              {t("detail.suspendDialog.alert.description")}
            </p>
          </div>
        </div>
      }
      onCancel={handleClose}
      isActionDisabled={isSubmitting || mutation.isPending}
      isPending={mutation.isPending}
      cancelLabel={t("detail.suspendDialog.cancel")}
      cancelTestId="suspend-cancel"
      submitLabel={t("detail.suspendDialog.submit")}
      submittingLabel={t("detail.suspendDialog.submitting")}
      submitTestId="suspend-submit"
      submitButtonClassName="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
    />
  )
}
