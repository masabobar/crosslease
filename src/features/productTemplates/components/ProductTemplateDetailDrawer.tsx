import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { formatDateTime } from "@/lib/formatters"
import { NPV_FORMULA_OPTIONS } from "@/features/productTemplates/constants"
import { ProductTemplatePublishedActions } from "@/features/productTemplates/components/ProductTemplatePublishedActions"
import { useTemplateVersionDetail } from "@/features/productTemplates/hooks/useTemplateVersionDetail"
import { TemplateStatusSchema } from "@/features/productTemplates/api/schema"
import type {
  TemplateCurrentVersionSummary,
  TemplateVersionDetail,
} from "@/features/productTemplates/api/schema"
import { productTemplateVersionHistory } from "@/router/paths"

type ProductTemplateDetailDrawerProps = {
  templateId: string | null
  currentVersion: TemplateCurrentVersionSummary | null
  canManageDraft: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DrawerSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2 border-t border-border py-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

function DrawerRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-right">{value}</span>
    </div>
  )
}

// Read-only detail body. Enum-to-label lookups intentionally mirror the wizard's
// ReviewStep (2nd occurrence per the Rule of Three — noted, not yet extracted). The
// Orchestration linkage section and the created-by/updated-by/updated-at/tenant metadata
// rows are omitted (not stubbed) because the backend does not expose them — see
// open-questions Q-028; do not add placeholder UI for them.
function DetailBody({ detail }: { detail: TemplateVersionDetail }) {
  const { t } = useTranslation("productTemplates")
  const npvFormula = NPV_FORMULA_OPTIONS.find(
    o => o.ref === detail.npv_formula_ref
  )
  const assetCategories = detail.allowed_asset_categories ?? []

  return (
    <div className="flex flex-col px-4">
      <DrawerSection title={t("sections.identity")}>
        <DrawerRow
          label={t("fields.templateName")}
          value={detail.template_name}
        />
        <DrawerRow
          label={t("fields.templateDescription")}
          value={detail.template_description || "—"}
        />
      </DrawerSection>

      <DrawerSection title={t("sections.behavioralSettings")}>
        <DrawerRow
          label={t("fields.financingType")}
          value={t(
            `financingTypes.${detail.financing_type}` as "financingTypes.full_refinancing"
          )}
        />
        <DrawerRow
          label={t("fields.legalStructure")}
          value={t(
            `legalStructures.${detail.legal_structure}` as "legalStructures.loan_credit"
          )}
        />
        <DrawerRow
          label={t("fields.paymentTiming")}
          value={t(
            `paymentTimings.${detail.payment_timing}` as "paymentTimings.advance"
          )}
        />
        <DrawerRow
          label={t("fields.rateBasis")}
          value={t(`rateBases.${detail.rate_basis}` as "rateBases.30_360")}
        />
        <DrawerRow
          label={t("fields.calculationModel")}
          value={t(
            `calculationModels.${detail.calculation_model}` as "calculationModels.annuity"
          )}
        />
        <DrawerRow
          label={t("fields.rateType")}
          value={
            detail.rate_type
              ? t(`rateTypes.${detail.rate_type}` as "rateTypes.fixed")
              : "—"
          }
        />
        <DrawerRow
          label={t("fields.firstInstallmentRule")}
          value={
            detail.first_installment_rule
              ? t(
                  `firstInstallmentRules.${detail.first_installment_rule}` as "firstInstallmentRules.following_month"
                )
              : "—"
          }
        />
        <DrawerRow
          label={t("fields.disbursementDerivationRule")}
          value={
            detail.disbursement_derivation_rule
              ? t(
                  `disbursementDerivationRules.${detail.disbursement_derivation_rule}` as "disbursementDerivationRules.npv"
                )
              : "—"
          }
        />
        <DrawerRow
          label={t("sections.npvFormulaReference")}
          value={
            npvFormula
              ? `${t(npvFormula.labelKey)} · ${npvFormula.code} ${npvFormula.version}`
              : (detail.npv_formula_ref ?? "—")
          }
        />
      </DrawerSection>

      <DrawerSection title={t("sections.eligibility")}>
        <DrawerRow
          label={t("sections.allowedAssetCategories")}
          value={
            assetCategories.length > 0 ? (
              <span className="flex flex-wrap justify-end gap-1.5">
                {assetCategories.map(category => (
                  <span
                    key={category}
                    className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-foreground"
                  >
                    {t(
                      `assetCategories.${category}` as "assetCategories.machinery"
                    )}
                  </span>
                ))}
              </span>
            ) : (
              "—"
            )
          }
        />
        <DrawerRow
          label={t("fields.minTermMonths")}
          value={detail.min_term_months ?? "—"}
        />
        <DrawerRow
          label={t("fields.maxTermMonths")}
          value={detail.max_term_months ?? "—"}
        />
        <DrawerRow
          label={t("fields.maxLtvRatio")}
          value={
            detail.max_ltv_ratio !== undefined && detail.max_ltv_ratio !== null
              ? `${detail.max_ltv_ratio}%`
              : "—"
          }
        />
        <DrawerRow
          label={t("fields.minVolumeEur")}
          value={
            detail.min_volume_eur !== undefined &&
            detail.min_volume_eur !== null
              ? `€ ${detail.min_volume_eur.toLocaleString()}`
              : "—"
          }
        />
        <DrawerRow
          label={t("fields.maxVolumeEur")}
          value={
            detail.max_volume_eur !== undefined &&
            detail.max_volume_eur !== null
              ? `€ ${detail.max_volume_eur.toLocaleString()}`
              : "—"
          }
        />
      </DrawerSection>

      <DrawerSection title={t("sections.validity")}>
        <DrawerRow
          label={t("fields.validFrom")}
          value={detail.valid_from || "—"}
        />
        <DrawerRow
          label={t("fields.validUntil")}
          value={detail.valid_until || t("fields.openEnded")}
        />
      </DrawerSection>

      <DrawerSection title={t("sections.metadata")}>
        <DrawerRow
          label={t("fields.createdAt")}
          value={detail.created_at ? formatDateTime(detail.created_at) : "—"}
        />
      </DrawerSection>
    </div>
  )
}

export function ProductTemplateDetailDrawer({
  templateId,
  currentVersion,
  canManageDraft,
  open,
  onOpenChange,
}: ProductTemplateDetailDrawerProps) {
  const { t } = useTranslation("productTemplates")
  const versionNumber = currentVersion?.version_number ?? null

  const { data, isLoading, isError } = useTemplateVersionDetail(
    templateId ?? "",
    versionNumber
  )

  const isPublished =
    data?.version_status === TemplateStatusSchema.enum.published

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
        data-testid="product-template-detail-drawer"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>{data?.template_name ?? t("detail.title")}</SheetTitle>
          <SheetDescription>
            {data
              ? `${data.version_number} · ${t(`versionStatuses.${data.version_status}` as "versionStatuses.draft")}`
              : t("detail.subtitle")}
          </SheetDescription>
          {templateId && (
            <Link
              to={productTemplateVersionHistory(templateId)}
              data-testid="drawer-view-version-history"
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("detail.viewVersionHistory")}
              <ExternalLink size={14} />
            </Link>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {!versionNumber && (
            <p className="px-4 text-sm text-muted-foreground">
              {t("detail.noPublishedVersion")}
            </p>
          )}
          {versionNumber && isLoading && (
            <p className="px-4 text-sm text-muted-foreground">
              {t("detail.loading")}
            </p>
          )}
          {versionNumber && isError && (
            <p
              data-testid="drawer-error"
              className="px-4 text-sm text-destructive"
            >
              {t("errors.generic")}
            </p>
          )}
          {data && <DetailBody detail={data} />}
        </div>

        {data && isPublished && canManageDraft && templateId && (
          <SheetFooter className="border-t border-border">
            <ProductTemplatePublishedActions
              templateId={templateId}
              versionNumber={data.version_number}
            />
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
