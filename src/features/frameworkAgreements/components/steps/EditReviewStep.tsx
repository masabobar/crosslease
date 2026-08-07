import type { UseFormReturn } from "react-hook-form"
import { useFormState, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api"
import { formatCurrency } from "@/lib/formatters"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { ReviewRow } from "@/features/frameworkAgreements/components/ReviewRow"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { useResolveFrameworkAgreementFieldError } from "@/features/frameworkAgreements/utils"
import type {
  EditFrameworkAgreementFormValues,
  FADetailResponse,
} from "@/features/frameworkAgreements/api/schema"

type Props = {
  form: UseFormReturn<EditFrameworkAgreementFormValues>
  frameworkAgreement: FADetailResponse
}

function EditReviewStep({ form, frameworkAgreement }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { register, control } = form
  const { errors } = useFormState({ control })
  const values = useWatch({ control })
  const resolveMsg = useResolveFrameworkAgreementFieldError()
  const {
    data: templatesData,
    isError: isTemplatesError,
    error: templatesError,
  } = useSelectableProductTemplates()

  const selectedTemplates = (values.product_template_ids ?? []).map(id => {
    const option = templatesData?.items.find(o => o.template_id === id)
    return {
      id,
      label: option ? `${option.template_name} v${option.version_number}` : id,
    }
  })

  return (
    <div className="flex flex-col gap-4" data-testid="edit-fa-review-step">
      <SectionCard title={t("wizard.steps.identity")}>
        <div className="grid grid-cols-3 gap-4">
          <ReviewRow
            label={t("fields.agreementName")}
            value={values.agreement_name || "—"}
          />
          <ReviewRow
            label={t("fields.leasingCompany")}
            value={frameworkAgreement.lc_partner_name ?? "—"}
          />
          <ReviewRow
            label={t("fields.currency")}
            value={frameworkAgreement.currency}
          />
        </div>
      </SectionCard>

      <SectionCard title={t("wizard.steps.envelopePricing")}>
        <div className="grid grid-cols-3 gap-4">
          <ReviewRow
            label={t("fields.maxVolumeEur")}
            value={
              values.max_volume_eur !== undefined &&
              !Number.isNaN(values.max_volume_eur)
                ? formatCurrency(
                    values.max_volume_eur,
                    frameworkAgreement.currency
                  )
                : "—"
            }
          />
          <ReviewRow
            label={t("fields.vfeAmountEur")}
            value={
              values.vfe_amount_eur !== undefined &&
              !Number.isNaN(values.vfe_amount_eur)
                ? formatCurrency(
                    values.vfe_amount_eur,
                    frameworkAgreement.currency
                  )
                : "—"
            }
          />
        </div>
      </SectionCard>

      <SectionCard title={t("wizard.steps.validityTemplates")}>
        <div className="grid grid-cols-2 gap-4">
          <ReviewRow
            label={t("fields.validFrom")}
            value={values.valid_from || "—"}
          />
          <ReviewRow
            label={t("fields.validUntil")}
            value={values.valid_until || t("fields.openEnded")}
          />
        </div>
        <ReviewRow
          label={t("fields.allowedProductTemplates")}
          value={
            selectedTemplates.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplates.map(template => (
                    <span
                      key={template.id}
                      className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-foreground"
                    >
                      {template.label}
                    </span>
                  ))}
                </div>
                {/* The selection itself comes from form state and is intact; only the
                    name lookup failed, so each chip falls back to a raw id above. */}
                {isTemplatesError && (
                  <p
                    data-testid="edit-fa-review-template-names-error"
                    className="text-xs text-destructive"
                  >
                    {t("wizard.templateNamesUnavailable")}{" "}
                    {templatesError instanceof ApiError
                      ? t(`errors.${templatesError.code}` as "errors.generic", {
                          defaultValue: t("errors.generic"),
                        })
                      : t("errors.generic")}
                  </p>
                )}
              </div>
            ) : (
              "—"
            )
          }
        />
      </SectionCard>

      {values.special_conditions && (
        <SectionCard title={t("wizard.steps.conditions")}>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {values.special_conditions}
          </p>
        </SectionCard>
      )}

      {/* Plain bordered box rather than a SectionCard: the field needs its own <Label>
          for the textarea, and a card heading above it would just repeat that label. */}
      <div className="border border-border rounded-xl bg-background p-4">
        <Label
          htmlFor="edit_justification"
          error={!!errors.justification}
          className="mb-2"
        >
          {t("edit.justification")}
        </Label>
        <Textarea
          id="edit_justification"
          data-testid="edit-justification-textarea"
          className="min-h-[100px] resize-y"
          rows={4}
          aria-invalid={!!errors.justification}
          {...register("justification")}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("edit.justificationHint")}
        </p>
        {errors.justification && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.justification.message)}
          </p>
        )}
      </div>
    </div>
  )
}

export { EditReviewStep }
