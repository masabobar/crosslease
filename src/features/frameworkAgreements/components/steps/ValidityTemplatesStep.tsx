import type { UseFormReturn } from "react-hook-form"
import { Controller, useFormState, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { addDays, parseISO, startOfToday } from "date-fns"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { ProductTemplatesField } from "@/features/frameworkAgreements/components/steps/ProductTemplatesField"
import { useResolveFrameworkAgreementFieldError } from "@/features/frameworkAgreements/utils"
import type { FrameworkAgreementWizardForm } from "@/features/frameworkAgreements/api/schema"

type Props = {
  form: UseFormReturn<FrameworkAgreementWizardForm>
}

function ValidityTemplatesStep({ form }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { control } = form
  const { errors } = useFormState({ control })
  const resolveMsg = useResolveFrameworkAgreementFieldError()
  const validFrom = useWatch({ control, name: "valid_from" })

  // A new agreement cannot start in the past, and valid_until must fall strictly
  // after valid_from (CreateFARequest rejects equal dates) — so the end date's
  // floor is the day after the chosen start. Edit is unconstrained by design:
  // existing agreements legitimately have start dates in the past.
  const today = startOfToday()
  const validUntilMin = validFrom ? addDays(parseISO(validFrom), 1) : today

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="fa-validity-templates-step"
    >
      <SectionCard title={t("wizard.validityTemplates.validityWindowSection")}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="valid_from"
              error={!!errors.valid_from}
              className="mb-2"
            >
              {t("fields.validFrom")}
            </Label>
            <Controller
              control={control}
              name="valid_from"
              render={({ field }) => (
                <DatePicker
                  id="valid_from"
                  data-testid="valid-from-datepicker"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.valid_from}
                  minDate={today}
                  captionLayout="dropdown"
                />
              )}
            />
            {errors.valid_from && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.valid_from.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="valid_until"
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
                  id="valid_until"
                  data-testid="valid-until-datepicker"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.valid_until}
                  minDate={validUntilMin}
                  captionLayout="dropdown"
                />
              )}
            />
            {errors.valid_until && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.valid_until.message)}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      <ProductTemplatesField
        control={control}
        errors={errors}
        resolveMsg={resolveMsg}
      />
    </div>
  )
}

export { ValidityTemplatesStep }
