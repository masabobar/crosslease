import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Info } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
        if (err instanceof ApiError) {
          switch (err.code) {
            case "TENANT_NOT_REACTIVATABLE":
              toast.error(
                t("detail.reactivateDialog.errors.TENANT_NOT_REACTIVATABLE")
              )
              return
            default:
              toast.error(t("detail.reactivateDialog.errors.generic"))
              return
          }
        }
        toast.error(t("detail.reactivateDialog.errors.generic"))
      },
    })
  }

  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("detail.reactivateDialog.title")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        {/* Content */}
        <div className="flex flex-col gap-6 px-4 py-4">
          {/* Tenant info rows */}
          <div className="flex flex-col gap-4">
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
          </div>

          <Separator />

          {/* Justification input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="reactivate-justification"
                className="text-sm font-medium"
              >
                {t("detail.reactivateDialog.fields.justification")}
              </Label>
              <span className="text-sm text-muted-foreground/80">
                {t("detail.reactivateDialog.fields.justificationMinChars")}
              </span>
            </div>
            <Textarea
              id="reactivate-justification"
              data-testid="reactivate-justification"
              placeholder={t(
                "detail.reactivateDialog.fields.justificationPlaceholder"
              )}
              rows={4}
              {...register("justification")}
            />
            {errors.justification ? (
              <p className="text-sm text-destructive" role="alert">
                {t("detail.reactivateDialog.errors.justificationTooShort")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/80">
                {t("detail.reactivateDialog.fields.justificationHint")}
              </p>
            )}
          </div>

          {/* Four-Eyes info alert */}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || mutation.isPending}
            data-testid="reactivate-cancel"
          >
            {t("detail.reactivateDialog.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            data-testid="reactivate-submit"
          >
            {mutation.isPending
              ? t("detail.reactivateDialog.submitting")
              : t("detail.reactivateDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}
