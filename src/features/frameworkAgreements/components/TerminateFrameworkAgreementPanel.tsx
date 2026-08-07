import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { useTerminateFrameworkAgreement } from "@/features/frameworkAgreements/hooks/useTerminateFrameworkAgreement"
import { useFrameworkAgreementTerminationReadiness } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementTerminationReadiness"
import { useResolveFrameworkAgreementFieldError } from "@/features/frameworkAgreements/utils"
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
  frameworkAgreementId: string
  onCancel: () => void
  onTerminated: () => void
}

// Shared shell for the two non-form states (readiness check failed / termination
// blocked) — same header/body chrome as the form state, differing only in content.
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
    <div className="border border-border rounded-xl bg-background overflow-hidden">
      <div className="bg-muted px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {title}
        </p>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {children}
        <div className="flex items-center justify-end">
          <Button
            type="button"
            onClick={onClose}
            data-testid="terminate-blocked-close"
          >
            {closeLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Inline confirmation section, not a pop-up — CR-FA-09 on PRD1042-1799. See
// ActivateFrameworkAgreementPanel for the sibling and the pattern it follows.
function TerminateFrameworkAgreementPanel({
  frameworkAgreementId,
  onCancel,
  onTerminated,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const mutation = useTerminateFrameworkAgreement()
  const resolveMsg = useResolveFrameworkAgreementFieldError()
  const {
    data: readiness,
    isLoading: isReadinessLoading,
    isError: isReadinessError,
  } = useFrameworkAgreementTerminationReadiness(frameworkAgreementId, true)

  const {
    handleSubmit,
    control,
    register,
    setError,
    getValues,
    formState: { errors },
  } = useForm<TerminateFARequest>({
    resolver: zodResolver(terminateFormSchema),
    defaultValues: { irreversibility_confirmed: false, justification: "" },
  })

  function onSubmit(values: TerminateFARequest) {
    mutation.mutate(
      { id: frameworkAgreementId, body: values },
      {
        onSuccess: () => onTerminated(),
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

  const isBlocked = !isReadinessLoading && readiness?.can_terminate === false

  if (isReadinessError) {
    return (
      <TerminateBlockedMessage
        title={t("terminate.blockedTitle")}
        onClose={onCancel}
        closeLabel={t("wizard.actions.cancel")}
      >
        <p className="text-sm text-destructive">{t("errors.generic")}</p>
      </TerminateBlockedMessage>
    )
  }

  if (isBlocked) {
    return (
      <TerminateBlockedMessage
        title={t("terminate.blockedTitle")}
        onClose={onCancel}
        closeLabel={t("wizard.actions.cancel")}
      >
        <p className="text-sm text-muted-foreground">
          {t("terminate.blockedDescription", {
            count: readiness.blocking_financing_count,
          })}
        </p>
      </TerminateBlockedMessage>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border border-border rounded-xl bg-background overflow-hidden"
      data-testid="terminate-fa-panel"
    >
      <div className="bg-muted px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {t("terminate.dialogTitle")}
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4">
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
            {resolveMsg(errors.irreversibility_confirmed.message)}
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
              {resolveMsg(errors.justification.message)}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
      </div>
    </form>
  )
}

export { TerminateFrameworkAgreementPanel }
