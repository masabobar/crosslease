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
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { useReactivateFrameworkAgreement } from "@/features/frameworkAgreements/hooks/useReactivateFrameworkAgreement"
import { ReactivateFARequestSchema } from "@/features/frameworkAgreements/api/schema"
import type { ReactivateFARequest } from "@/features/frameworkAgreements/api/schema"

const reactivateFormSchema = ReactivateFARequestSchema.extend({
  re_validation_confirmed:
    ReactivateFARequestSchema.shape.re_validation_confirmed.refine(
      v => v === true,
      "required"
    ),
})

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  frameworkAgreementId: string
}

function ReactivateFrameworkAgreementDialog({
  open,
  onOpenChange,
  frameworkAgreementId,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const mutation = useReactivateFrameworkAgreement()

  const {
    setError,
    getValues,
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors },
  } = useForm<ReactivateFARequest>({
    resolver: zodResolver(reactivateFormSchema),
    defaultValues: { re_validation_confirmed: false, justification: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: ReactivateFARequest) {
    mutation.mutate(
      { id: frameworkAgreementId, body: values },
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
            <DialogTitle>{t("reactivate.dialogTitle")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Controller
              control={control}
              name="re_validation_confirmed"
              render={({ field }) => (
                <Checkbox
                  data-testid="reactivate-re-validation-confirmed"
                  checked={field.value}
                  onCheckedChange={v => field.onChange(v === true)}
                />
              )}
            />
            <span className="text-sm text-foreground">
              {t("reactivate.reValidationConfirmed")}
            </span>
          </label>
          {errors.re_validation_confirmed && (
            <p className="text-xs text-destructive">
              {errors.re_validation_confirmed.message}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reactivate-justification">
              {t("reactivate.justification")}
            </Label>
            <Textarea
              id="reactivate-justification"
              data-testid="reactivate-justification"
              rows={3}
              aria-invalid={!!errors.justification}
              {...register("justification")}
            />
            <p className="text-xs text-muted-foreground">
              {t("reactivate.justificationHint")}
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
            data-testid="reactivate-cancel"
          >
            {t("wizard.actions.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="reactivate-confirm"
          >
            {t("reactivate.confirmButton")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { ReactivateFrameworkAgreementDialog }
