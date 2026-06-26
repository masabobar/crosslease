import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRevokeGrant } from "@/features/tenants/hooks/useRevokeGrant"
import { RevokeGrantFormSchema } from "@/features/tenants/api/schema"
import type {
  RevokeGrantForm,
  SupportGrant,
} from "@/features/tenants/api/schema"
import { ApiError } from "@/lib/api"
import { formatDateTime } from "@/lib/formatters"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName: string
  grant: SupportGrant
  granteeName: string
}

export function RevokeGrantDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  grant,
  granteeName,
}: Props) {
  const { t } = useTranslation("tenants")
  const mutation = useRevokeGrant(tenantId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RevokeGrantForm>({
    resolver: zodResolver(RevokeGrantFormSchema),
    defaultValues: { revocation_reason: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: RevokeGrantForm) {
    mutation.mutate(
      {
        grantId: grant.id,
        payload: { revocation_reason: values.revocation_reason },
      },
      {
        onSuccess: () => {
          toast.warning(t("detail.grants.revokeDialog.successToast.title"), {
            description: t(
              "detail.grants.revokeDialog.successToast.description",
              { granteeName, tenantName }
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
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("detail.grants.revokeDialog.title")}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{tenantName}</p>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-6 px-4 py-4">
          {/* Read-only grant summary */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("detail.grants.revokeDialog.info.affectedUser")}
              </span>
              <span className="font-semibold text-foreground">
                {granteeName}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("detail.grants.revokeDialog.info.accessReason")}
              </span>
              <span className="font-semibold text-foreground">
                {t(`detail.grants.accessReasons.${grant.access_reason}`)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("detail.grants.revokeDialog.info.activeUntil")}
              </span>
              <span className="text-foreground">
                {formatDateTime(grant.valid_until)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Revocation reason */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="revocation-reason"
                className="text-sm font-medium"
              >
                {t("detail.grants.revokeDialog.fields.revocationReason")}
              </Label>
              <span className="text-xs text-muted-foreground/80">
                {t(
                  "detail.grants.revokeDialog.fields.revocationReasonMinChars"
                )}
              </span>
            </div>
            <Textarea
              id="revocation-reason"
              data-testid="revocation-reason"
              rows={3}
              {...register("revocation_reason")}
            />
            {errors.revocation_reason ? (
              <p className="text-sm text-destructive" role="alert">
                {t("detail.grants.revokeDialog.errors.reasonTooShort")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/80">
                {t("detail.grants.revokeDialog.fields.revocationReasonHint")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || mutation.isPending}
            data-testid="revoke-dialog-cancel"
          >
            {t("detail.grants.revokeDialog.cancel")}
          </Button>
          <Button
            type="submit"
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
            disabled={isSubmitting || mutation.isPending}
            data-testid="revoke-dialog-submit"
          >
            {mutation.isPending
              ? t("detail.grants.revokeDialog.submitting")
              : t("detail.grants.revokeDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}
