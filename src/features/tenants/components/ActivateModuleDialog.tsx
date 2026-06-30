import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ModuleStatusBadge } from "@/features/tenants/components/ModuleStatusBadge"
import { useActivateTenantModule } from "@/features/tenants/hooks/useActivateTenantModule"
import { ModuleActivateFormSchema } from "@/features/tenants/api/schema"
import type {
  ModuleActivateForm,
  TenantModuleEntry,
} from "@/features/tenants/api/schema"
import { ApiError } from "@/lib/api"

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
        {/* Header */}
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>
              {t("detail.modules.activateDialog.title")}
            </DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        {/* Content */}
        <div className="flex flex-col gap-6 px-4 py-4">
          {/* Module info rows */}
          <div className="flex flex-col gap-4">
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
          </div>

          <Separator />

          {/* Justification */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="activate-justification"
                className="text-sm font-medium"
              >
                {t("detail.modules.activateDialog.fields.justification")}
              </Label>
              <span className="text-sm text-muted-foreground/80">
                {t(
                  "detail.modules.activateDialog.fields.justificationMinChars"
                )}
              </span>
            </div>
            <Textarea
              id="activate-justification"
              data-testid="activate-justification"
              rows={3}
              {...register("justification")}
            />
            {errors.justification ? (
              <p className="text-sm text-destructive" role="alert">
                {t(
                  "detail.modules.activateDialog.errors.justificationTooShort"
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/80">
                {t("detail.modules.activateDialog.fields.justificationHint")}
              </p>
            )}
          </div>

          {/* Four-Eyes warning */}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || mutation.isPending}
            data-testid="activate-module-cancel"
          >
            {t("detail.modules.activateDialog.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            data-testid="activate-module-submit"
          >
            {mutation.isPending
              ? t("detail.modules.activateDialog.submitting")
              : t("detail.modules.activateDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}
