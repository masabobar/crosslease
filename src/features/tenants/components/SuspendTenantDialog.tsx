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
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { useSuspendTenant } from "@/features/tenants/hooks/useSuspendTenant"
import { SuspendTenantFormSchema } from "@/features/tenants/api/schema"
import type {
  SuspendTenantForm,
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
        toast.error(
          err instanceof ApiError
            ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")
        )
      },
    })
  }

  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("detail.suspendDialog.title")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        {/* Content */}
        <div className="flex flex-col gap-6 px-4 py-4">
          {/* Tenant info rows */}
          <div className="flex flex-col gap-4">
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
          </div>

          <Separator />

          {/* Justification input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="suspend-justification"
                className="text-sm font-medium"
              >
                {t("detail.suspendDialog.fields.justification")}
              </Label>
              <span className="text-sm text-muted-foreground/80">
                {t("detail.suspendDialog.fields.justificationMinChars")}
              </span>
            </div>
            <Textarea
              id="suspend-justification"
              data-testid="suspend-justification"
              placeholder={t(
                "detail.suspendDialog.fields.justificationPlaceholder"
              )}
              rows={4}
              {...register("justification")}
            />
            {errors.justification ? (
              <p className="text-sm text-destructive" role="alert">
                {t("detail.suspendDialog.errors.justificationTooShort")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/80">
                {t("detail.suspendDialog.fields.justificationHint")}
              </p>
            )}
          </div>

          {/* Four-Eyes warning alert */}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || mutation.isPending}
            data-testid="suspend-cancel"
          >
            {t("detail.suspendDialog.cancel")}
          </Button>
          <Button
            type="submit"
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
            disabled={isSubmitting || mutation.isPending}
            data-testid="suspend-submit"
          >
            {mutation.isPending
              ? t("detail.suspendDialog.submitting")
              : t("detail.suspendDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}
