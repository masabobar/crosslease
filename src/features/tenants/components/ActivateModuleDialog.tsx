import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { ModuleStatusBadge } from "@/features/tenants/components/ModuleStatusBadge"
import { useActivateTenantModule } from "@/features/tenants/hooks/useActivateTenantModule"
import { ModuleActivateFormSchema } from "@/features/tenants/api/schema"
import type {
  ModuleActivateForm,
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

export function ActivateModuleDialog({
  open,
  onOpenChange,
  tenantId,
  module,
}: Props) {
  const { t } = useTranslation("tenants")
  const mutation = useActivateTenantModule(tenantId)

  const {
    setError,
    getValues,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ModuleActivateForm>({
    resolver: zodResolver(ModuleActivateFormSchema),
    defaultValues: { justification: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: ModuleActivateForm) {
    mutation.mutate(
      {
        moduleKey: module.key,
        payload: { justification: values.justification },
      },
      {
        onSuccess: () => {
          toast.info(t("detail.modules.activateDialog.successToast.title"), {
            description: t(
              "detail.modules.activateDialog.successToast.description",
              { moduleName: module.display_name }
            ),
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
      }
    )
  }

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit(onSubmit)}
      title={t("detail.modules.activateDialog.title")}
      infoRows={
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {t("detail.modules.activateDialog.info.moduleName")}
            </span>
            <span className="text-foreground font-medium">
              {module.display_name}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {t("detail.modules.activateDialog.info.currentStatus")}
            </span>
            <ModuleStatusBadge status={module.status} />
          </div>
        </>
      }
      justificationFieldId="activate-justification"
      justificationLabel={t(
        "detail.modules.activateDialog.fields.justification"
      )}
      justificationMinCharsLabel={t(
        "detail.modules.activateDialog.fields.justificationMinChars"
      )}
      justificationHint={t(
        "detail.modules.activateDialog.fields.justificationHint"
      )}
      justificationErrorMessage={
        errors.justification
          ? t("detail.modules.activateDialog.errors.justificationTooShort")
          : undefined
      }
      justificationRegister={register("justification")}
      extraContent={
        <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-amber-500/10">
          <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-amber-600">
              {t("detail.modules.activateDialog.alert.title")}
            </p>
            <p className="text-sm text-amber-600/80">
              {t("detail.modules.activateDialog.alert.description")}
            </p>
          </div>
        </div>
      }
      onCancel={handleClose}
      isActionDisabled={isSubmitting || mutation.isPending}
      isPending={mutation.isPending}
      cancelLabel={t("detail.modules.activateDialog.cancel")}
      cancelTestId="activate-module-cancel"
      submitLabel={t("detail.modules.activateDialog.submit")}
      submittingLabel={t("detail.modules.activateDialog.submitting")}
      submitTestId="activate-module-submit"
    />
  )
}
