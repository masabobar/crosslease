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
import { useActivateFrameworkAgreement } from "@/features/frameworkAgreements/hooks/useActivateFrameworkAgreement"
import { ActivateFARequestSchema } from "@/features/frameworkAgreements/api/schema"
import type { ActivateFARequest } from "@/features/frameworkAgreements/api/schema"

const activateFormSchema = ActivateFARequestSchema.extend({
  documents_confirmed: ActivateFARequestSchema.shape.documents_confirmed.refine(
    v => v === true,
    "required"
  ),
})

type Props = {
  frameworkAgreementId: string
  onCancel: () => void
  onActivated: () => void
}

// Inline confirmation section, not a pop-up — CR-FA-09 on PRD1042-1799 moves activation
// and termination into the form flow. Matches the bordered-card pattern the rest of the
// detail page already uses (see the Identity/Credit envelope sections) rather than the
// dialog chrome this replaces.
function ActivateFrameworkAgreementPanel({
  frameworkAgreementId,
  onCancel,
  onActivated,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const mutation = useActivateFrameworkAgreement()

  const {
    setError,
    getValues,
    handleSubmit,
    control,
    register,
    formState: { errors },
  } = useForm<ActivateFARequest>({
    resolver: zodResolver(activateFormSchema),
    defaultValues: { documents_confirmed: false, justification: "" },
  })

  function onSubmit(values: ActivateFARequest) {
    mutation.mutate(
      { id: frameworkAgreementId, body: values },
      {
        onSuccess: () => onActivated(),
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border border-border rounded-xl bg-background overflow-hidden"
      data-testid="activate-fa-panel"
    >
      <div className="bg-muted px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {t("activate.dialogTitle")}
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <Controller
            control={control}
            name="documents_confirmed"
            render={({ field }) => (
              <Checkbox
                data-testid="activate-documents-confirmed"
                checked={field.value}
                onCheckedChange={v => field.onChange(v === true)}
              />
            )}
          />
          <span className="text-sm text-foreground">
            {t("activate.documentsConfirmed")}
          </span>
        </label>
        {errors.documents_confirmed && (
          <p className="text-xs text-destructive">
            {errors.documents_confirmed.message}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activate-justification">
            {t("activate.justification")}
          </Label>
          <Textarea
            id="activate-justification"
            data-testid="activate-justification"
            rows={3}
            aria-invalid={!!errors.justification}
            {...register("justification")}
          />
          <p className="text-xs text-muted-foreground">
            {t("activate.justificationHint")}
          </p>
          {errors.justification && (
            <p className="text-xs text-destructive">
              {errors.justification.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={mutation.isPending}
            data-testid="activate-cancel"
          >
            {t("wizard.actions.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="activate-confirm"
          >
            {t("activate.confirmButton")}
          </Button>
        </div>
      </div>
    </form>
  )
}

export { ActivateFrameworkAgreementPanel }
