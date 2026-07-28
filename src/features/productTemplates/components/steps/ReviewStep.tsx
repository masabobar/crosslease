import type { UseFormReturn } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SectionCard } from "@/features/productTemplates/components/SectionCard"
import type { ProductTemplateWizardForm } from "@/features/productTemplates/api/schema"

type Props = {
  form: UseFormReturn<ProductTemplateWizardForm>
  justification: string
  onJustificationChange: (value: string) => void
  isConfirmed: boolean
  onIsConfirmedChange: (value: boolean) => void
}

function ReviewRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function ReviewStep({
  form,
  justification,
  onJustificationChange,
  isConfirmed,
  onIsConfirmedChange,
}: Props) {
  const { t } = useTranslation("productTemplates")
  const values = useWatch({ control: form.control })

  return (
    <div className="flex flex-col gap-4" data-testid="review-step">
      <SectionCard title={t("sections.identity")}>
        <ReviewRow
          label={t("fields.templateName")}
          value={values.template_name || "—"}
        />
        {values.template_description && (
          <ReviewRow
            label={t("fields.templateDescription")}
            value={values.template_description}
          />
        )}
      </SectionCard>

      <SectionCard title={t("sections.behavioralSettings")}>
        <div className="grid grid-cols-2 gap-4">
          <ReviewRow
            label={t("fields.financingType")}
            value={
              values.financing_type
                ? t(
                    `financingTypes.${values.financing_type}` as "financingTypes.full_refinancing"
                  )
                : "—"
            }
          />
          <ReviewRow
            label={t("fields.legalStructure")}
            value={
              values.legal_structure
                ? t(
                    `legalStructures.${values.legal_structure}` as "legalStructures.loan_credit"
                  )
                : "—"
            }
          />
          <ReviewRow
            label={t("fields.paymentTiming")}
            value={
              values.payment_timing
                ? t(
                    `paymentTimings.${values.payment_timing}` as "paymentTimings.advance"
                  )
                : "—"
            }
          />
          <ReviewRow
            label={t("fields.rateBasis")}
            value={
              values.rate_basis
                ? t(`rateBases.${values.rate_basis}` as "rateBases.30_360")
                : "—"
            }
          />
          <ReviewRow
            label={t("fields.calculationModel")}
            value={
              values.calculation_model
                ? t(
                    `calculationModels.${values.calculation_model}` as "calculationModels.annuity"
                  )
                : "—"
            }
          />
          <ReviewRow
            label={t("fields.firstInstallmentRule")}
            value={
              values.first_installment_rule
                ? t(
                    `firstInstallmentRules.${values.first_installment_rule}` as "firstInstallmentRules.following_month"
                  )
                : "—"
            }
          />
          <ReviewRow
            label={t("fields.disbursementDerivationRule")}
            value={
              values.disbursement_derivation_rule
                ? t(
                    `disbursementDerivationRules.${values.disbursement_derivation_rule}` as "disbursementDerivationRules.npv"
                  )
                : "—"
            }
          />
        </div>
      </SectionCard>

      <SectionCard title={t("sections.eligibility")}>
        <ReviewRow
          label={t("sections.allowedAssetCategories")}
          value={
            (values.allowed_asset_categories ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(values.allowed_asset_categories ?? []).map(category => (
                  <span
                    key={category}
                    className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-foreground"
                  >
                    {t(
                      `assetCategories.${category}` as "assetCategories.machinery"
                    )}
                  </span>
                ))}
              </div>
            ) : (
              "—"
            )
          }
        />
        <div className="grid grid-cols-2 gap-4">
          <ReviewRow
            label={t("fields.minTermMonths")}
            value={values.min_term_months ?? "—"}
          />
          <ReviewRow
            label={t("fields.maxTermMonths")}
            value={values.max_term_months ?? "—"}
          />
          <ReviewRow
            label={t("fields.maxLtvRatio")}
            value={
              values.max_ltv_ratio !== undefined &&
              values.max_ltv_ratio !== null
                ? `${values.max_ltv_ratio}%`
                : "—"
            }
          />
          <ReviewRow
            label={t("fields.minVolumeEur")}
            value={values.min_volume_eur ?? "—"}
          />
          <ReviewRow
            label={t("fields.maxVolumeEur")}
            value={values.max_volume_eur ?? "—"}
          />
        </div>
      </SectionCard>

      <SectionCard title={t("sections.validity")}>
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
      </SectionCard>

      <div className="flex flex-col gap-2">
        <Label htmlFor="publication_justification">
          {t("fields.publicationJustification")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("fields.optional")}
          </span>
        </Label>
        <Textarea
          id="publication_justification"
          data-testid="publication-justification-textarea"
          placeholder={t("fields.publicationJustificationPlaceholder")}
          rows={3}
          value={justification}
          onChange={e => onJustificationChange(e.target.value)}
        />
      </div>

      <label
        htmlFor="confirm-publication"
        className="flex items-center gap-2 cursor-pointer"
      >
        <Checkbox
          id="confirm-publication"
          data-testid="confirm-publication-checkbox"
          checked={isConfirmed}
          onCheckedChange={value => onIsConfirmedChange(value === true)}
        />
        <span className="text-sm text-foreground">
          {t("fields.confirmPublication")}
        </span>
      </label>
    </div>
  )
}

export { ReviewStep }
