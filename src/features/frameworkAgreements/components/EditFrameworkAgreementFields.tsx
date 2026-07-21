import type { UseFormReturn } from "react-hook-form"
import { Controller, useFormState, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { EnvelopePricingFields } from "@/features/frameworkAgreements/components/steps/EnvelopePricingFields"
import { ProductTemplatesField } from "@/features/frameworkAgreements/components/steps/ProductTemplatesField"
import { useResolveFrameworkAgreementFieldError } from "@/features/frameworkAgreements/utils"
import type { EditFrameworkAgreementFormValues } from "@/features/frameworkAgreements/api/schema"

type Props = {
  form: UseFormReturn<EditFrameworkAgreementFormValues>
  isDraft: boolean
  validUntilDisabled: boolean
  validUntilMinDate: Date | undefined
}

function EditFrameworkAgreementFields({
  form,
  isDraft,
  validUntilDisabled,
  validUntilMinDate,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { register, control } = form
  const { errors } = useFormState({ control })
  const validFrom = useWatch({ control, name: "valid_from" })
  const resolveMsg = useResolveFrameworkAgreementFieldError()

  const validUntilMin = isDraft
    ? validFrom
      ? new Date(validFrom)
      : undefined
    : validUntilMinDate

  return (
    <div className="flex flex-col gap-4" data-testid="edit-fa-fields">
      <EnvelopePricingFields
        register={register}
        control={control}
        errors={errors}
        resolveMsg={resolveMsg}
        idPrefix="edit_"
        testIdPrefix="edit-"
      />

      <SectionCard title={t("wizard.validityTemplates.validityWindowSection")}>
        <div>
          <Label
            htmlFor="edit_valid_until"
            error={!!errors.valid_until}
            className="mb-2"
          >
            {t("fields.validUntil")}{" "}
            <span className="font-normal text-muted-foreground">
              {t("fields.optional")}
            </span>
          </Label>
          <Controller
            control={control}
            name="valid_until"
            render={({ field }) => (
              <DatePicker
                id="edit_valid_until"
                data-testid="edit-valid-until-datepicker"
                value={field.value}
                onChange={field.onChange}
                error={!!errors.valid_until}
                disabled={validUntilDisabled}
                minDate={validUntilMin}
                captionLayout="dropdown"
              />
            )}
          />
          {validUntilDisabled && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("edit.validUntilLockedHint")}
            </p>
          )}
          {errors.valid_until && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.valid_until.message)}
            </p>
          )}
        </div>
      </SectionCard>

      <ProductTemplatesField
        control={control}
        errors={errors}
        resolveMsg={resolveMsg}
        hint={t("edit.templateRemovalHint")}
      />

      <div className="border border-border rounded-xl bg-background p-4">
        <Label htmlFor="edit_special_conditions" className="mb-2">
          {t("fields.specialConditions")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("fields.optional")}
          </span>
        </Label>
        <Textarea
          id="edit_special_conditions"
          data-testid="edit-special-conditions-textarea"
          className="min-h-[120px] resize-none"
          rows={5}
          {...register("special_conditions")}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("wizard.conditions.hint")}
        </p>
        {errors.special_conditions && (
          <p className="mt-1 text-sm text-destructive">
            {errors.special_conditions.message}
          </p>
        )}
      </div>
    </div>
  )
}

export { EditFrameworkAgreementFields }
