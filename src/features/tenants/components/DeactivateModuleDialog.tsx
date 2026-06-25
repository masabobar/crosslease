import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { CircleCheckBig, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ModuleStatusBadge } from "@/features/tenants/components/ModuleStatusBadge"
import { useDeactivateTenantModule } from "@/features/tenants/hooks/useDeactivateTenantModule"
import { ModuleDeactivateFormSchema } from "@/features/tenants/api/schema"
import type {
  ModuleDeactivateForm,
  TenantModuleEntry,
} from "@/features/tenants/api/schema"
import { ApiError } from "@/lib/api"

const DEP_CHECK_DELAY_MS = 1_200

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
  const [depCheck, setDepCheck] = useState<"checking" | "resolved">("checking")

  useEffect(() => {
    const timer = setTimeout(() => setDepCheck("resolved"), DEP_CHECK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const {
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
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic")
          )
        },
      }
    )
  }

  const isChecking = depCheck === "checking"

  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>
              {t("detail.modules.deactivateDialog.title")}
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
          </div>

          <Separator />

          {/* Dependency check */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm font-medium text-foreground">
                {t("detail.modules.deactivateDialog.dependencyCheck.title")}
              </span>
              {isChecking ? (
                <Loader2
                  size={16}
                  className="text-muted-foreground/70 animate-spin shrink-0"
                />
              ) : (
                <CircleCheckBig size={16} className="text-green-600 shrink-0" />
              )}
            </div>
            {isChecking ? (
              <div className="flex items-center justify-center h-[84px] bg-slate-100 rounded-xl px-4 py-3">
                <p className="text-sm text-muted-foreground/80 text-center">
                  {t(
                    "detail.modules.deactivateDialog.dependencyCheck.checking"
                  )}
                </p>
              </div>
            ) : (
              <div className="flex items-start h-[84px] bg-slate-100 rounded-xl border-l-[3px] border-green-600 px-4 py-3">
                <p className="text-sm text-muted-foreground/80">
                  {t(
                    "detail.modules.deactivateDialog.dependencyCheck.resolved"
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Justification */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="deactivate-justification"
                className="text-sm font-medium"
              >
                {t("detail.modules.deactivateDialog.fields.justification")}
              </Label>
              <span className="text-sm text-muted-foreground/80">
                {t(
                  "detail.modules.deactivateDialog.fields.justificationMinChars"
                )}
              </span>
            </div>
            <Textarea
              id="deactivate-justification"
              data-testid="deactivate-justification"
              rows={3}
              {...register("justification")}
            />
            {errors.justification ? (
              <p className="text-sm text-destructive" role="alert">
                {t(
                  "detail.modules.deactivateDialog.errors.justificationTooShort"
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/80">
                {t("detail.modules.deactivateDialog.fields.justificationHint")}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || mutation.isPending}
            data-testid="deactivate-module-cancel"
          >
            {t("detail.modules.deactivateDialog.cancel")}
          </Button>
          <Button
            type="submit"
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-0 rounded-xl"
            disabled={isSubmitting || mutation.isPending || isChecking}
            data-testid="deactivate-module-submit"
          >
            {mutation.isPending
              ? t("detail.modules.deactivateDialog.submitting")
              : t("detail.modules.deactivateDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}
