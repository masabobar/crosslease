import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ApiError } from "@/lib/api"
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
    handleSubmit,
    reset,
    control,
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
    mutation.mutate(
      {
        id: frameworkAgreementId,
        body: {
          ...values,
          // DatePicker emits "yyyy-MM-dd"; the API expects a timezone-aware datetime
          effective_from: values.effective_from
            ? new Date(values.effective_from).toISOString()
            : null,
        },
      },
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
            <Label htmlFor="suspend-effective-from">
              {t("suspend.effectiveFrom")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("suspend.effectiveFromOptional")}
              </span>
            </Label>
            <Controller
              control={control}
              name="effective_from"
              render={({ field }) => (
                <DatePicker
                  id="suspend-effective-from"
                  data-testid="suspend-effective-from"
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  captionLayout="dropdown"
                />
              )}
            />
          </div>

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
