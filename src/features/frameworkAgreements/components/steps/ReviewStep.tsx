import type { UseFormReturn } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { ReviewRow } from "@/features/frameworkAgreements/components/ReviewRow"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import type { FrameworkAgreementWizardForm } from "@/features/frameworkAgreements/api/schema"
import type { FrameworkAgreementDocumentDraft } from "@/features/frameworkAgreements/types"

type Props = {
  form: UseFormReturn<FrameworkAgreementWizardForm>
  documents: FrameworkAgreementDocumentDraft[]
}

function ReviewStep({ form, documents }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const values = useWatch({ control: form.control })
  const { data: templatesData } = useSelectableProductTemplates()

  const selectedTemplates = (values.product_template_ids ?? []).map(id => {
    const option = templatesData?.items.find(o => o.template_id === id)
    return {
      id,
      label: option ? `${option.template_name} v${option.version_number}` : id,
    }
  })

  return (
    <div className="flex flex-col gap-4" data-testid="fa-review-step">
      <SectionCard title={t("wizard.steps.identity")}>
        <div className="grid grid-cols-2 gap-4">
          <ReviewRow
            label={t("fields.agreementName")}
            value={values.agreement_name || "—"}
          />
          <ReviewRow
            label={t("fields.leasingCompany")}
            value={values.lc_partner_name || "—"}
          />
          <ReviewRow
            label={t("fields.bankEntity")}
            value={
              values.bank_entity ? t(`bankEntities.${values.bank_entity}`) : "—"
            }
          />
          <ReviewRow label={t("fields.currency")} value="EUR" />
        </div>
      </SectionCard>

      <SectionCard title={t("wizard.steps.envelopePricing")}>
        <div className="grid grid-cols-3 gap-4">
          <ReviewRow
            label={t("fields.maxVolumeEur")}
            value={
              values.max_volume_eur !== undefined
                ? `${values.max_volume_eur.toLocaleString()} EUR`
                : "—"
            }
          />
          <ReviewRow
            label={t("fields.baseRate")}
            value={
              values.base_rate !== undefined ? `${values.base_rate}%` : "—"
            }
          />
          <ReviewRow
            label={t("fields.spread")}
            value={values.spread !== undefined ? `${values.spread}%` : "—"}
          />
          <ReviewRow
            label={t("fields.rateType")}
            value={values.rate_type ? t(`rateTypes.${values.rate_type}`) : "—"}
          />
          <ReviewRow
            label={t("fields.effectiveRate")}
            value={
              values.effective_rate !== undefined
                ? `${values.effective_rate}%`
                : "—"
            }
          />
          <ReviewRow
            label={t("fields.rateLockPeriodMonths")}
            value={values.rate_lock_period_months ?? "—"}
          />
          <ReviewRow
            label={t("fields.lgCoverageRateOverride")}
            value={
              values.lg_coverage_rate_override !== undefined &&
              !Number.isNaN(values.lg_coverage_rate_override)
                ? `${values.lg_coverage_rate_override}%`
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

      <SectionCard title={t("wizard.steps.documents")}>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <div className="flex flex-col gap-2">
            {documents.map((doc, index) => (
              <div
                key={`${doc.file.name}-${index}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">{doc.file.name}</span>
                <span className="text-muted-foreground">
                  {doc.documentType
                    ? t(`documentTypes.${doc.documentType}`)
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export { ReviewStep }
