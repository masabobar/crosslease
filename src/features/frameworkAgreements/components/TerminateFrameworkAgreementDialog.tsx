import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ApiError } from "@/lib/api"
import { useTerminateFrameworkAgreement } from "@/features/frameworkAgreements/hooks/useTerminateFrameworkAgreement"
import { useFrameworkAgreementTerminationReadiness } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementTerminationReadiness"
import { TerminateFARequestSchema } from "@/features/frameworkAgreements/api/schema"
import type { TerminateFARequest } from "@/features/frameworkAgreements/api/schema"

const terminateFormSchema = TerminateFARequestSchema.extend({
  irreversibility_confirmed:
    TerminateFARequestSchema.shape.irreversibility_confirmed.refine(
      v => v === true,
      "required"
    ),
})

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  frameworkAgreementId: string
}

// Shared shell for the two non-form states (readiness check failed / termination
// blocked) — same header/separator/single-close-button chrome, differing only in
// the message content.
function TerminateBlockedMessage({
  title,
  onClose,
  closeLabel,
  children,
}: {
  title: string
  onClose: () => void
  closeLabel: string
  children: React.ReactNode
}) {
  return (
    <>
      <div className="px-4 py-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
      </div>
      <Separator />
      <div className="px-4 py-4">{children}</div>
      <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
        <Button
          type="button"
          onClick={onClose}
          data-testid="terminate-blocked-close"
        >
          {closeLabel}
        </Button>
      </div>
    </>
  )
}

function TerminateFrameworkAgreementDialog({
  open,
  onOpenChange,
  frameworkAgreementId,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const mutation = useTerminateFrameworkAgreement()
  const {
    data: readiness,
    isLoading: isReadinessLoading,
    isError: isReadinessError,
  } = useFrameworkAgreementTerminationReadiness(frameworkAgreementId, open)

  const {
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors },
  } = useForm<TerminateFARequest>({
    resolver: zodResolver(terminateFormSchema),
    defaultValues: { irreversibility_confirmed: false, justification: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: TerminateFARequest) {
    mutation.mutate(
      { id: frameworkAgreementId, body: values },
      {
        onSuccess: () => handleClose(),
        onError: err => {
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

  const isBlocked = !isReadinessLoading && readiness?.can_terminate === false

  return (
    <DialogModal open={open} onOpenChange={o => !o && handleClose()}>
      {isReadinessError ? (
        <TerminateBlockedMessage
          title={t("terminate.blockedTitle")}
          onClose={handleClose}
          closeLabel={t("wizard.actions.cancel")}
        >
          <p className="text-sm text-destructive">{t("errors.generic")}</p>
        </TerminateBlockedMessage>
      ) : isBlocked ? (
        <TerminateBlockedMessage
          title={t("terminate.blockedTitle")}
          onClose={handleClose}
          closeLabel={t("wizard.actions.cancel")}
        >
          <p className="text-sm text-muted-foreground">
            {t("terminate.blockedDescription", {
              count: readiness.blocking_financing_count,
            })}
          </p>
        </TerminateBlockedMessage>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-4 py-4">
            <DialogHeader>
              <DialogTitle>{t("terminate.dialogTitle")}</DialogTitle>
            </DialogHeader>
          </div>

          <Separator />

          <div className="flex flex-col gap-4 px-4 py-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Controller
                control={control}
                name="irreversibility_confirmed"
                render={({ field }) => (
                  <Checkbox
                    data-testid="terminate-irreversibility-confirmed"
                    checked={field.value}
                    onCheckedChange={v => field.onChange(v === true)}
                  />
                )}
              />
              <span className="text-sm text-foreground">
                {t("terminate.irreversibilityConfirmed")}
              </span>
            </label>
            {errors.irreversibility_confirmed && (
              <p className="text-xs text-destructive">
                {errors.irreversibility_confirmed.message}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="terminate-justification">
                {t("terminate.justification")}
              </Label>
              <Textarea
                id="terminate-justification"
                data-testid="terminate-justification"
                rows={3}
                aria-invalid={!!errors.justification}
                {...register("justification")}
              />
              <p className="text-xs text-muted-foreground">
                {t("terminate.justificationHint")}
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
              data-testid="terminate-cancel"
            >
              {t("wizard.actions.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={mutation.isPending || isReadinessLoading}
              data-testid="terminate-confirm"
            >
              {t("terminate.confirmButton")}
            </Button>
          </div>
        </form>
      )}
    </DialogModal>
  )
}

export { TerminateFrameworkAgreementDialog }
