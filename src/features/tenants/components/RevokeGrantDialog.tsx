import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
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
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit(onSubmit)}
      title={t("detail.grants.revokeDialog.title")}
      subtitle={tenantName}
      infoRows={
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("detail.grants.revokeDialog.info.affectedUser")}
            </span>
            <span className="font-semibold text-foreground">{granteeName}</span>
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
        </>
      }
      justificationFieldId="revocation-reason"
      justificationLabel={t(
        "detail.grants.revokeDialog.fields.revocationReason"
      )}
      justificationMinCharsLabel={t(
        "detail.grants.revokeDialog.fields.revocationReasonMinChars"
      )}
      justificationHint={t(
        "detail.grants.revokeDialog.fields.revocationReasonHint"
      )}
      justificationErrorMessage={
        errors.revocation_reason
          ? t("detail.grants.revokeDialog.errors.reasonTooShort")
          : undefined
      }
      justificationRegister={register("revocation_reason")}
      onCancel={handleClose}
      isActionDisabled={isSubmitting || mutation.isPending}
      isPending={mutation.isPending}
      cancelLabel={t("detail.grants.revokeDialog.cancel")}
      cancelTestId="revoke-dialog-cancel"
      submitLabel={t("detail.grants.revokeDialog.submit")}
      submittingLabel={t("detail.grants.revokeDialog.submitting")}
      submitTestId="revoke-dialog-submit"
      submitButtonClassName="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
    />
  )
}
