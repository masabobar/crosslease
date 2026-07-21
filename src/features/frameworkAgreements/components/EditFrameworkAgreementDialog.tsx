import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ApiError } from "@/lib/api"
import { useUpdateFrameworkAgreement } from "@/features/frameworkAgreements/hooks/useUpdateFrameworkAgreement"
import {
  EditFrameworkAgreementFormSchema,
  FALifecycleStatusSchema,
} from "@/features/frameworkAgreements/api/schema"
import type {
  EditFrameworkAgreementFormValues,
  FADetailResponse,
  UpdateFARequest,
} from "@/features/frameworkAgreements/api/schema"
import { EditFrameworkAgreementFields } from "@/features/frameworkAgreements/components/EditFrameworkAgreementFields"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  frameworkAgreement: FADetailResponse
}

function EditFrameworkAgreementDialog({
  open,
  onOpenChange,
  frameworkAgreement,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const mutation = useUpdateFrameworkAgreement()

  const isDraft =
    frameworkAgreement.status === FALifecycleStatusSchema.enum.draft
  const identityLocked = !isDraft
  const validUntilDisabled = !isDraft && frameworkAgreement.valid_until === null
  const validUntilMinDate =
    !isDraft && frameworkAgreement.valid_until
      ? new Date(frameworkAgreement.valid_until)
      : undefined

  const form = useForm<EditFrameworkAgreementFormValues>({
    resolver: zodResolver(EditFrameworkAgreementFormSchema),
    values: {
      agreement_name: frameworkAgreement.agreement_name,
      max_volume_eur: frameworkAgreement.max_volume_eur,
      base_rate: frameworkAgreement.base_rate ?? 0,
      spread: frameworkAgreement.spread ?? 0,
      rate_type: frameworkAgreement.rate_type ?? "fixed",
      effective_rate: frameworkAgreement.effective_rate ?? 0,
      rate_lock_period_months: frameworkAgreement.rate_lock_period_months ?? 1,
      lg_coverage_rate_override:
        frameworkAgreement.lg_coverage_rate_override ?? undefined,
      valid_from: frameworkAgreement.valid_from,
      valid_until: frameworkAgreement.valid_until ?? "",
      special_conditions: frameworkAgreement.special_conditions ?? "",
      product_template_ids: frameworkAgreement.product_template_ids,
      justification: "",
      expected_version: frameworkAgreement.edit_version_counter,
    },
  })
  const {
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors },
  } = form

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: EditFrameworkAgreementFormValues) {
    const {
      justification,
      expected_version,
      agreement_name,
      valid_from,
      ...rest
    } = values

    const body: UpdateFARequest = {
      ...rest,
      valid_until: values.valid_until || undefined,
      lg_coverage_rate_override: values.lg_coverage_rate_override ?? undefined,
      justification,
      expected_version,
      ...(isDraft ? { agreement_name, valid_from } : {}),
    }

    mutation.mutate(
      { id: frameworkAgreement.id, body },
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
            <DialogTitle>{t("edit.dialogTitle")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="border border-border rounded-xl bg-muted/40 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("edit.identitySection")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_agreement_name" className="mb-2">
                  {t("fields.agreementName")}
                </Label>
                <Input
                  id="edit_agreement_name"
                  data-testid="edit-agreement-name-input"
                  disabled={identityLocked}
                  error={!!errors.agreement_name}
                  {...register("agreement_name")}
                />
                {errors.agreement_name && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.agreement_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit_valid_from" className="mb-2">
                  {t("fields.validFrom")}
                </Label>
                <Controller
                  control={control}
                  name="valid_from"
                  render={({ field }) => (
                    <DatePicker
                      id="edit_valid_from"
                      data-testid="edit-valid-from-datepicker"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={identityLocked}
                      error={!!errors.valid_from}
                      captionLayout="dropdown"
                    />
                  )}
                />
              </div>
            </div>
            {identityLocked && (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("edit.lockedFieldHint")}
              </p>
            )}
          </div>

          <EditFrameworkAgreementFields
            form={form}
            isDraft={isDraft}
            validUntilDisabled={validUntilDisabled}
            validUntilMinDate={validUntilMinDate}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-justification">
              {t("edit.justification")}
            </Label>
            <Textarea
              id="edit-justification"
              data-testid="edit-justification"
              rows={3}
              aria-invalid={!!errors.justification}
              {...register("justification")}
            />
            <p className="text-xs text-muted-foreground">
              {t("edit.justificationHint")}
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
            data-testid="edit-cancel"
          >
            {t("wizard.actions.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="edit-confirm"
          >
            {t("edit.confirmButton")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { EditFrameworkAgreementDialog }
