import type { UseFormReturn } from "react-hook-form"
import { Controller, useFormState, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { addDays, parseISO } from "date-fns"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { ProductTemplatesField } from "@/features/frameworkAgreements/components/steps/ProductTemplatesField"
import { isFrameworkAgreementDraft } from "@/features/frameworkAgreements/editWizard"
import { useResolveFrameworkAgreementFieldError } from "@/features/frameworkAgreements/utils"
import type {
  EditFrameworkAgreementFormValues,
  FADetailResponse,
} from "@/features/frameworkAgreements/api/schema"

type Props = {
  form: UseFormReturn<EditFrameworkAgreementFormValues>
  frameworkAgreement: FADetailResponse
}

function EditValidityTemplatesStep({ form, frameworkAgreement }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { control } = form
  const { errors } = useFormState({ control })
  const resolveMsg = useResolveFrameworkAgreementFieldError()
  const validFrom = useWatch({ control, name: "valid_from" })

  const isDraft = isFrameworkAgreementDraft(frameworkAgreement)
  // Once past Draft an end date can only be extended (FA_VALID_UNTIL_SHORTENING), and an
  // open-ended agreement can never gain one at all. Drafts keep the create-wizard rule:
  // the day after valid_from, since UpdateFARequest rejects equal dates.
  const validUntilDisabled = !isDraft && frameworkAgreement.valid_until === null
  const validUntilMin = isDraft
    ? validFrom
      ? addDays(parseISO(validFrom), 1)
      : undefined
    : frameworkAgreement.valid_until
      ? new Date(frameworkAgreement.valid_until)
      : undefined

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="edit-fa-validity-templates-step"
    >
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
    </div>
  )
}

export { EditValidityTemplatesStep }
