import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionCard } from "@/components/shared/SectionCard"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import { formatCurrency, formatDateTime } from "@/lib/formatters"
import { isUuidRouteParam, isVersionNumberRouteParam } from "@/lib/routeParams"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { NPV_FORMULA_OPTIONS } from "@/features/productTemplates/constants"
import { DetailRow } from "@/features/productTemplates/components/ProductTemplateDetailPrimitives"
import { ProductTemplatePublishedActions } from "@/features/productTemplates/components/ProductTemplatePublishedActions"
import { TemplateVersionStatusBadge } from "@/features/productTemplates/components/TemplateVersionStatusBadge"
import { useTemplateVersionDetail } from "@/features/productTemplates/hooks/useTemplateVersionDetail"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES } from "@/features/productTemplates/types"
import { TemplateStatusSchema } from "@/features/productTemplates/api/schema"
import { resolveApiErrorMessage } from "@/features/productTemplates/utils"
import { productTemplateVersionHistory } from "@/router/paths"

/**
 * Full detail view for one version of a Bank Product Template — CR-BPT-06 on PRD1042-1798,
 * FE sub-task PRD1042-1804.
 *
 * ── DESIGN PROVENANCE ──────────────────────────────────────────────────────────────────────
 * NOTE: this page was NOT built from a Figma frame. None exists. Figma
 * `ebt0zjSok9kW8WsaKTwky0` holds one section, "LIST + DETAILS", containing a list frame, a
 * list-with-drawer frame, and a single standalone Drawer frame 500 × 1916 — a full-height scrolling
 * drawer, which is precisely the thing CR-BPT-06 replaces. There is no detail-page frame and no
 * slim-drawer frame (verified by enumerating every `name=` in that node). See open-questions Q-028.
 *
 * The layout is **derived**, on explicit instruction, from the User Management pattern the CR itself
 * cites: `UserDetailPage.tsx` composing cards, with the drawer reduced to key fields plus a link
 * through to here. Treat it as an interpretation, not as design-verified — expect fidelity
 * corrections once a frame exists.
 *
 * ── VERSION-SCOPED BY DESIGN ───────────────────────────────────────────────────────────────
 * The route carries `:versionNumber` as well as `:templateId`, because the underlying
 * `GET /product-templates/{templateId}/versions/{versionNumber}` is version-scoped and the drawer
 * this page expands was already showing exactly one version. It also means the page keeps working
 * for a non-current version the moment CR-BPT-04's backend change lands — that CR makes older
 * versions first-class, so a version-agnostic URL would have had to invent a "which version" rule.
 *
 * ── WHAT IS DELIBERATELY ABSENT ────────────────────────────────────────────────────────────
 * Orchestration linkage, the template code, and the created-by / modified-by / modified-at /
 * tenant-name metadata are omitted rather than stubbed, because the backend does not expose them
 * (open-questions Q-028). The drawer already omits them; this page inherits the omission on purpose.
 * Do not add placeholder UI for them — that is the fake surface `api-first.md` §4 forbids.
 */
export default function ProductTemplateDetailPage() {
  const { t } = useTranslation("productTemplates")
  const { templateId: templateIdParam, versionNumber: versionNumberParam } =
    useParams<{
      templateId: string
      versionNumber: string
    }>()
  // Validated then reused under the same names, so the usages below are unchanged. A
  // malformed link resolves to null and the not-found branch fires before any request.
  const templateId = isUuidRouteParam(templateIdParam)
    ? templateIdParam
    : undefined
  const versionNumber = isVersionNumberRouteParam(versionNumberParam)
    ? versionNumberParam
    : undefined
  const { data: currentUser } = useCurrentUser()

  const { data, isLoading, isError, error } = useTemplateVersionDetail(
    templateId ?? "",
    versionNumber ?? null
  )

  if (templateId === undefined || versionNumber === undefined) {
    return <NotFoundPage />
  }

  const canManageDraft = Boolean(
    currentUser?.role &&
    PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES.includes(currentUser.role)
  )

  if (isLoading) {
    return (
      <div
        className="p-8 flex flex-col gap-4"
        data-testid="product-template-detail-loading"
      >
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <p
          data-testid="product-template-detail-error"
          className="text-sm text-destructive py-8 text-center"
        >
          {resolveApiErrorMessage(error, t)}
        </p>
      </div>
    )
  }

  const npvFormula = NPV_FORMULA_OPTIONS.find(
    o => o.ref === data.npv_formula_ref
  )
  const assetCategories = data.allowed_asset_categories ?? []
  const isActive = data.version_status === TemplateStatusSchema.enum.active
  const isDraft = data?.version_status === TemplateStatusSchema.enum.draft
  const notSet = "—"

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {templateId && (
          <Link
            to={productTemplateVersionHistory(templateId)}
            data-testid="detail-page-back-to-version-history"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline w-fit"
          >
            <ArrowLeft size={14} />
            {t("detail.page.backToVersionHistory")}
          </Link>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium text-foreground">
            {data.template_name}
          </h1>
          <TemplateVersionStatusBadge status={data.version_status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("detail.page.subtitle", { version: data.version_number })}
        </p>
      </div>

      <SectionCard title={t("sections.identity")} testIdPrefix="detail-page-">
        <DetailRow
          label={t("fields.templateName")}
          value={data.template_name}
        />
        <DetailRow
          label={t("fields.templateDescription")}
          value={data.template_description || notSet}
        />
      </SectionCard>

      <SectionCard
        title={t("sections.behavioralSettings")}
        testIdPrefix="detail-page-"
      >
        <DetailRow
          label={t("fields.financingType")}
          value={t(
            `financingTypes.${data.financing_type}` as "financingTypes.full_refinancing"
          )}
        />
        <DetailRow
          label={t("fields.legalStructure")}
          value={t(
            `legalStructures.${data.legal_structure}` as "legalStructures.loan_credit"
          )}
        />
        <DetailRow
          label={t("fields.paymentTiming")}
          value={t(
            `paymentTimings.${data.payment_timing}` as "paymentTimings.advance"
          )}
        />
        <DetailRow
          label={t("fields.rateBasis")}
          value={t(`rateBases.${data.rate_basis}` as "rateBases.30_360")}
        />
        <DetailRow
          label={t("fields.calculationModel")}
          value={t(
            `calculationModels.${data.calculation_model}` as "calculationModels.annuity"
          )}
        />
        <DetailRow
          label={t("fields.rateType")}
          value={
            data.rate_type
              ? t(`rateTypes.${data.rate_type}` as "rateTypes.fixed")
              : notSet
          }
        />
        <DetailRow
          label={t("fields.firstInstallmentRule")}
          value={
            data.first_installment_rule
              ? t(
                  `firstInstallmentRules.${data.first_installment_rule}` as "firstInstallmentRules.following_month"
                )
              : notSet
          }
        />
        <DetailRow
          label={t("fields.disbursementDerivationRule")}
          value={
            data.disbursement_derivation_rule
              ? t(
                  `disbursementDerivationRules.${data.disbursement_derivation_rule}` as "disbursementDerivationRules.npv"
                )
              : notSet
          }
        />
        {/* CR-BPT-02 on PRD1042-1798 — the refinancing rate belongs to the product now. */}
        <DetailRow
          label={t("fields.effectiveRate")}
          value={
            data.effective_rate !== undefined && data.effective_rate !== null
              ? `${data.effective_rate}%`
              : notSet
          }
        />
        <DetailRow
          label={t("sections.npvFormulaReference")}
          value={
            npvFormula
              ? `${t(npvFormula.labelKey)} · ${npvFormula.code} ${npvFormula.version}`
              : (data.npv_formula_ref ?? notSet)
          }
        />
      </SectionCard>

      <SectionCard
        title={t("sections.eligibility")}
        testIdPrefix="detail-page-"
      >
        <DetailRow
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
              notSet
            )
          }
        />
        <DetailRow
          label={t("fields.minTermMonths")}
          value={data.min_term_months ?? notSet}
        />
        <DetailRow
          label={t("fields.maxTermMonths")}
          value={data.max_term_months ?? notSet}
        />
        <DetailRow
          label={t("fields.maxLtvRatio")}
          value={
            data.max_ltv_ratio !== undefined && data.max_ltv_ratio !== null
              ? `${data.max_ltv_ratio}%`
              : notSet
          }
        />
        <DetailRow
          label={t("fields.minVolumeEur")}
          value={
            data.min_volume_eur !== undefined && data.min_volume_eur !== null
              ? formatCurrency(data.min_volume_eur, EUR_CURRENCY_CODE)
              : notSet
          }
        />
        <DetailRow
          label={t("fields.maxVolumeEur")}
          value={
            data.max_volume_eur !== undefined && data.max_volume_eur !== null
              ? formatCurrency(data.max_volume_eur, EUR_CURRENCY_CODE)
              : notSet
          }
        />
      </SectionCard>

      <SectionCard title={t("sections.validity")} testIdPrefix="detail-page-">
        <DetailRow
          label={t("fields.validFrom")}
          value={data.valid_from || notSet}
        />
        <DetailRow
          label={t("fields.validUntil")}
          value={data.valid_until || t("fields.openEnded")}
        />
      </SectionCard>

      <SectionCard title={t("sections.metadata")} testIdPrefix="detail-page-">
        <DetailRow
          label={t("fields.createdAt")}
          value={data.created_at ? formatDateTime(data.created_at) : notSet}
        />
      </SectionCard>

      {/* Same gate the drawer footer uses: active versions only, and only for a role that may
          author a draft. Kept identical so the two surfaces cannot disagree about what is offered. */}
      {(isActive || isDraft) && canManageDraft && templateId && (
        <div className="flex justify-end border-t border-border pt-4">
          <ProductTemplatePublishedActions
            templateId={templateId}
            versionNumber={data.version_number}
            isDraft={isDraft}
          />
        </div>
      )}
    </div>
  )
}
