import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { ShieldAlert, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { useArchiveTenant } from "@/features/tenants/hooks/useArchiveTenant"
import { createArchiveTenantFormSchema } from "@/features/tenants/api/schema"
import type {
  ArchiveTenantForm,
  TenantStatus,
} from "@/features/tenants/api/schema"
import { ApiError } from "@/lib/api"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName: string
  tenantStatus: TenantStatus
  activeUserCount: number
}

export function ArchiveTenantDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  tenantStatus,
  activeUserCount,
}: Props) {
  const { t } = useTranslation("tenants")
  const mutation = useArchiveTenant(tenantId)
  const hasActiveUsers = activeUserCount > 0
  const schema = createArchiveTenantFormSchema(hasActiveUsers)

  const {
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
            <DialogTitle>{t("detail.archiveDialog.title")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        {/* Content */}
        <div className="flex flex-col gap-6 px-4 py-4">
          {/* Tenant info rows */}
          <div className="flex flex-col gap-4">
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
          </div>

          <Separator />

          {/* Justification input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="archive-justification"
                className="text-sm font-medium"
              >
                {t("detail.archiveDialog.fields.justification")}
              </Label>
              <span className="text-sm text-muted-foreground/80">
                {t("detail.archiveDialog.fields.justificationMinChars")}
              </span>
            </div>
            <Textarea
              id="archive-justification"
              data-testid="archive-justification"
              placeholder={t(
                "detail.archiveDialog.fields.justificationPlaceholder"
              )}
              rows={4}
              {...register("justification")}
            />
            {errors.justification ? (
              <p className="text-sm text-destructive" role="alert">
                {t("detail.archiveDialog.errors.justificationTooShort")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/80">
                {t("detail.archiveDialog.fields.justificationHint")}
              </p>
            )}
          </div>

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
                {t("detail.archiveDialog.fields.activeUserAck", {
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || mutation.isPending}
            data-testid="archive-cancel"
          >
            {t("detail.archiveDialog.cancel")}
          </Button>
          <Button
            type="submit"
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
            disabled={isSubmitting || mutation.isPending}
            data-testid="archive-submit"
          >
            {mutation.isPending
              ? t("detail.archiveDialog.submitting")
              : t("detail.archiveDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}
