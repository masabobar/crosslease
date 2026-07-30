import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { ModuleStatusBadge } from "@/features/tenants/components/ModuleStatusBadge"
import { useDeactivateTenantModule } from "@/features/tenants/hooks/useDeactivateTenantModule"
import { ModuleDeactivateFormSchema } from "@/features/tenants/api/schema"
import type {
  ModuleDeactivateForm,
  TenantModuleEntry,
} from "@/features/tenants/api/schema"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  module: TenantModuleEntry
}

export function DeactivateModuleDialog({
  open,
  onOpenChange,
  tenantId,
  module,
}: Props) {
  const { t } = useTranslation("tenants")
  const mutation = useDeactivateTenantModule(tenantId)

  const {
    setError,
    getValues,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ModuleDeactivateForm>({
    resolver: zodResolver(ModuleDeactivateFormSchema),
    defaultValues: { justification: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: ModuleDeactivateForm) {
    mutation.mutate(
      {
        moduleKey: module.key,
        payload: { justification: values.justification },
      },
      {
        onSuccess: () => {
          toast.success(
            t("detail.modules.deactivateDialog.successToast.title"),
            {
              description: t(
                "detail.modules.deactivateDialog.successToast.description",
                { moduleName: module.display_name }
              ),
            }
          )
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
      title={t("detail.modules.deactivateDialog.title")}
      infoRows={
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {t("detail.modules.deactivateDialog.info.moduleName")}
            </span>
            <span className="text-foreground font-medium">
              {module.display_name}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {t("detail.modules.deactivateDialog.info.currentStatus")}
            </span>
            <ModuleStatusBadge status={module.status} />
          </div>
        </>
      }
      justificationFieldId="deactivate-justification"
      justificationLabel={t(
        "detail.modules.deactivateDialog.fields.justification"
      )}
      justificationMinCharsLabel={t(
        "detail.modules.deactivateDialog.fields.justificationMinChars"
      )}
      justificationHint={t(
        "detail.modules.deactivateDialog.fields.justificationHint"
      )}
      justificationErrorMessage={
        errors.justification
          ? t("detail.modules.deactivateDialog.errors.justificationTooShort")
          : undefined
      }
      justificationRegister={register("justification")}
      onCancel={handleClose}
      isActionDisabled={isSubmitting || mutation.isPending}
      isPending={mutation.isPending}
      cancelLabel={t("detail.modules.deactivateDialog.cancel")}
      cancelTestId="deactivate-module-cancel"
      submitLabel={t("detail.modules.deactivateDialog.submit")}
      submittingLabel={t("detail.modules.deactivateDialog.submitting")}
      submitTestId="deactivate-module-submit"
      submitButtonClassName="bg-destructive/10 text-destructive hover:bg-destructive/20 border-0 rounded-xl"
    />
  )
}
