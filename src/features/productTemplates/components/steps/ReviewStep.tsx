import type { UseFormReturn } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SectionCard } from "@/features/productTemplates/components/SectionCard"
import {
  DOCUMENT_OPTIONS,
  NPV_FORMULA_OPTIONS,
  VALIDATION_RULE_SET_OPTIONS,
  WORKFLOW_TASK_OPTIONS,
} from "@/features/productTemplates/constants"
import type { ProductTemplateWizardForm } from "@/features/productTemplates/api/schema"

type Props = {
  form: UseFormReturn<ProductTemplateWizardForm>
  justification: string
  onJustificationChange: (value: string) => void
  confirmed: boolean
  onConfirmedChange: (value: boolean) => void
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

function ReviewTagList({
  labels,
}: {
  labels: { key: string; label: string; sublabel?: string }[]
}) {
  if (labels.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map(item => (
        <span
          key={item.key}
          className="inline-flex flex-col rounded-lg border border-border px-2.5 py-1.5"
        >
          <span className="text-sm font-medium text-foreground">
            {item.label}
          </span>
          {item.sublabel && (
            <span className="text-xs text-muted-foreground">
              {item.sublabel}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

function ReviewStep({
  form,
  justification,
  onJustificationChange,
  confirmed,
  onConfirmedChange,
}: Props) {
  const { t } = useTranslation("productTemplates")
  const values = useWatch({ control: form.control })

  const npvFormula = NPV_FORMULA_OPTIONS.find(
    o => o.ref === values.npv_formula_ref
  )

  const workflowTaskTags = (values.required_workflow_tasks ?? []).map(id => {
    const option = WORKFLOW_TASK_OPTIONS.find(o => o.id === id)
    return {
      key: id,
      label: option ? t(option.labelKey) : id,
      sublabel: option ? `${option.code} · ${option.version}` : undefined,
    }
  })
  const requiredDocumentTags = (values.required_documents ?? []).map(id => {
    const option = DOCUMENT_OPTIONS.find(o => o.id === id)
    return {
      key: id,
      label: option ? t(option.labelKey) : id,
      sublabel: option ? `${option.code} · ${option.version}` : undefined,
    }
  })
  const optionalDocumentTags = (values.optional_documents ?? []).map(id => {
    const option = DOCUMENT_OPTIONS.find(o => o.id === id)
    return {
      key: id,
      label: option ? t(option.labelKey) : id,
      sublabel: option ? `${option.code} · ${option.version}` : undefined,
    }
  })
  const validationRuleSet = VALIDATION_RULE_SET_OPTIONS.find(
    o => o.id === values.validation_rule_set_id
  )

  return (
    <div className="flex flex-col gap-4" data-testid="review-step">
      <SectionCard title={t("sections.identity")}>
        <div className="grid grid-cols-2 gap-4">
          <ReviewRow
            label={t("fields.templateCode")}
            value={values.template_code || "—"}
          />
          <ReviewRow
            label={t("fields.templateName")}
            value={values.template_name || "—"}
          />
        </div>
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
            label={t("fields.rateType")}
            value={
              values.rate_type
                ? t(`rateTypes.${values.rate_type}` as "rateTypes.fixed")
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
        <ReviewRow
          label={t("sections.npvFormulaReference")}
          value={
            npvFormula ? (
              <span className="inline-flex items-center gap-1.5">
                {t(npvFormula.labelKey)}
                <span className="text-xs text-muted-foreground">
                  {npvFormula.code} · {npvFormula.version}
                </span>
              </span>
            ) : (
              "—"
            )
          }
        />
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

      <SectionCard title={t("sections.orchestrationLinkage")}>
        <ReviewRow
          label={t("sections.requiredWorkflowTasks")}
          value={<ReviewTagList labels={workflowTaskTags} />}
        />
        <ReviewRow
          label={t("sections.requiredDocuments")}
          value={<ReviewTagList labels={requiredDocumentTags} />}
        />
        <ReviewRow
          label={t("sections.optionalDocuments")}
          value={<ReviewTagList labels={optionalDocumentTags} />}
        />
        <ReviewRow
          label={t("sections.validationRuleSet")}
          value={
            <ReviewTagList
              labels={
                validationRuleSet
                  ? [
                      {
                        key: validationRuleSet.id,
                        label: t(validationRuleSet.labelKey),
                        sublabel: `${validationRuleSet.code} · ${validationRuleSet.version}`,
                      },
                    ]
                  : []
              }
            />
          }
        />
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
          checked={confirmed}
          onCheckedChange={value => onConfirmedChange(value === true)}
        />
        <span className="text-sm text-foreground">
          {t("fields.confirmPublication")}
        </span>
      </label>
    </div>
  )
}

export { ReviewStep }
