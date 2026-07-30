import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { useSuspendFrameworkAgreement } from "@/features/frameworkAgreements/hooks/useSuspendFrameworkAgreement"
import { SuspendFARequestSchema } from "@/features/frameworkAgreements/api/schema"
import type { SuspendFARequest } from "@/features/frameworkAgreements/api/schema"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  frameworkAgreementId: string
}

function SuspendFrameworkAgreementDialog({
  open,
  onOpenChange,
  frameworkAgreementId,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const mutation = useSuspendFrameworkAgreement()

  const {
    setError,
    getValues,
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<SuspendFARequest>({
    resolver: zodResolver(SuspendFARequestSchema),
    defaultValues: { justification: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: SuspendFARequest) {
    // Suspension is always immediate — no effective_from is sent, the API
    // stamps suspended_at itself. Scheduled suspension is a future feature.
    mutation.mutate(
      {
        id: frameworkAgreementId,
        body: { justification: values.justification },
      },
      {
        onSuccess: () => handleClose(),
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
              ? t(`errors.${err.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")
          )
        },
      }
    )
  }

  return (
    <DialogModal open={open} onOpenChange={o => !o && handleClose()}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("suspend.dialogTitle")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="suspend-justification">
              {t("suspend.justification")}
            </Label>
            <Textarea
              id="suspend-justification"
              data-testid="suspend-justification"
              rows={3}
              aria-invalid={!!errors.justification}
              {...register("justification")}
            />
            <p className="text-xs text-muted-foreground">
              {t("suspend.justificationHint")}
            </p>
            {errors.justification && (
              <p className="text-xs text-destructive">
                {errors.justification.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-testid="suspend-cancel"
          >
            {t("wizard.actions.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="suspend-confirm"
          >
            {t("suspend.confirmButton")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { SuspendFrameworkAgreementDialog }
