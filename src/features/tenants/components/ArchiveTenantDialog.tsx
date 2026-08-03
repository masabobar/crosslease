import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { ShieldAlert, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { useArchiveTenant } from "@/features/tenants/hooks/useArchiveTenant"
import { createArchiveTenantFormSchema } from "@/features/tenants/api/schema"
import type {
  ArchiveTenantForm,
  TenantStatus,
} from "@/features/tenants/api/schema"
import { useTenantFormErrorHandler } from "@/features/tenants/hooks/useTenantFormErrorHandler"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName: string
  tenantStatus: TenantStatus
  activeUserCount: number
  // True when the active-user count could not be loaded (e.g. the detail
  // fetch failed). Treated as "active users may exist" so the acknowledgement
  // is still required rather than silently skipped.
  activeUserCountUnknown?: boolean
}

export function ArchiveTenantDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  tenantStatus,
  activeUserCount,
  activeUserCountUnknown = false,
}: Props) {
  const { t } = useTranslation("tenants")
  const mutation = useArchiveTenant(tenantId)
  const hasActiveUsers = activeUserCountUnknown || activeUserCount > 0
  const schema = createArchiveTenantFormSchema(hasActiveUsers)

  const {
    setError,
    getValues,
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ArchiveTenantForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      justification: "",
      irreversibility_acknowledgement: false,
      active_user_acknowledgement: false,
    },
  })

  const handleError = useTenantFormErrorHandler({ getValues, setError })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: ArchiveTenantForm) {
    mutation.mutate(
      {
        justification: values.justification,
        irreversibility_acknowledgement: values.irreversibility_acknowledgement,
      },
      {
        onSuccess: () => {
          toast.info(t("detail.archiveDialog.successToast.title"), {
            description: t("detail.archiveDialog.successToast.description", {
              tenantName,
            }),
          })
          handleClose()
        },
        onError: handleError,
      }
    )
  }

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit(onSubmit)}
      title={t("detail.archiveDialog.title")}
      infoRows={
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {t("detail.archiveDialog.info.tenant")}
            </span>
            <span className="text-foreground font-medium">{tenantName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {t("detail.archiveDialog.info.currentStatus")}
            </span>
            <TenantStatusBadge status={tenantStatus} />
          </div>
        </>
      }
      justificationFieldId="archive-justification"
      justificationLabel={t("detail.archiveDialog.fields.justification")}
      justificationMinCharsLabel={t(
        "detail.archiveDialog.fields.justificationMinChars"
      )}
      justificationHint={t("detail.archiveDialog.fields.justificationHint")}
      justificationErrorMessage={
        errors.justification
          ? t("detail.archiveDialog.errors.justificationTooShort")
          : undefined
      }
      justificationRegister={register("justification")}
      justificationPlaceholder={t(
        "detail.archiveDialog.fields.justificationPlaceholder"
      )}
      justificationRows={4}
      extraContent={
        <>
          {/* Irreversibility acknowledgement */}
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
              {t("detail.archiveDialog.fields.irreversibilityAck.prefix")}
              <strong>
                {t("detail.archiveDialog.fields.irreversibilityAck.emphasis")}
              </strong>
              {t("detail.archiveDialog.fields.irreversibilityAck.suffix")}
            </span>
          </label>

          {/* Conditional: active user acknowledgement */}
          {hasActiveUsers && (
            <label className="flex items-center gap-2 cursor-pointer">
              <Controller
                control={control}
                name="active_user_acknowledgement"
                render={({ field }) => (
                  <Checkbox
                    data-testid="archive-active-user-ack"
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <span className="text-sm text-foreground leading-snug">
                {activeUserCountUnknown
                  ? t("detail.archiveDialog.fields.activeUserAckUnknown")
                  : t("detail.archiveDialog.fields.activeUserAck", {
                      count: activeUserCount,
                    })}
              </span>
            </label>
          )}

          {/* Alerts */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-destructive/10">
              <TriangleAlert
                size={16}
                className="text-destructive shrink-0 mt-0.5"
              />
              <p className="text-sm text-destructive/80">
                {t("detail.archiveDialog.alert.destructive")}
              </p>
            </div>
            <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-amber-500/10">
              <ShieldAlert
                size={16}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-amber-600">
                  {t("detail.archiveDialog.alert.title")}
                </p>
                <p className="text-sm text-amber-600/80">
                  {t("detail.archiveDialog.alert.description")}
                </p>
              </div>
            </div>
          </div>
        </>
      }
      onCancel={handleClose}
      isActionDisabled={isSubmitting || mutation.isPending}
      isPending={mutation.isPending}
      cancelLabel={t("detail.archiveDialog.cancel")}
      cancelTestId="archive-cancel"
      submitLabel={t("detail.archiveDialog.submit")}
      submittingLabel={t("detail.archiveDialog.submitting")}
      submitTestId="archive-submit"
      submitButtonClassName="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
    />
  )
}
