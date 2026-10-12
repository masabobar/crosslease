import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Banknote, Box, FileSignature } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { isUuidRouteParam } from "@/lib/routeParams"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import {
  caseDetail,
  frameworkAgreementDetail,
  partnerDetail,
} from "@/router/paths"
import { CaseActivityPanel } from "@/features/cases/components/CaseActivityPanel"
import { CaseDocumentRequirementsPanel } from "@/features/documentRequirements/components/CaseDocumentRequirementsPanel"
import { useCase } from "@/features/cases/hooks/useCase"
import { useFinancingDetail } from "@/features/financing/hooks/useFinancingDetail"
import { FinancingDataTab } from "@/features/financing/components/FinancingDataTab"
import { FinancingCollateralsTab } from "@/features/financing/components/FinancingCollateralsTab"
import { FinancingContractsPanel } from "@/features/financing/components/FinancingContractsPanel"
import { ApprovalConditionsPanel } from "@/features/financing/components/ApprovalConditionsPanel"
import type { FinancingTabCounts } from "@/features/financing/api/financingDetailSchema"

const TAB_KEYS = [
  "data",
  "contracts",
  "collaterals",
  "covenants",
  "documents",
  "activity",
] as const
type TabKey = (typeof TAB_KEYS)[number]

// Which tabs carry a count, and where the count comes from. A tab the record does not count —
// Data, Documents, Activity — shows its name alone rather than a fabricated number.
const COUNT_OF: Partial<Record<TabKey, keyof FinancingTabCounts>> = {
  contracts: "contracts",
  collaterals: "collaterals",
  covenants: "covenants",
}

/**
 * The financing workspace.
 *
 * ── THE ROUTE IS KEYED ON THE FINANCING ────────────────────────────────────────────────────────
 * `GET /financings/{id}` landed on 12 Oct. Until then every financing figure hung off
 * `/cases/{case_id}/financing/…`, so this screen had to be addressed by its case; it is now
 * addressed by the financing, as the prototype has it, and the case is a link out rather than the
 * identity of the page.
 *
 * The detail arrives denormalised — case reference, leasing company, framework agreement and
 * product template all come with it — so the header resolves no names of its own.
 *
 * ── TWO TABS STILL READ THE CASE ───────────────────────────────────────────────────────────────
 * Documents and Activity. `/financings/{id}/document-rows`, `/financings/{id}/activity` and
 * `/financings/{id}/comments` all exist now, but the panels that render them are written against
 * the case surfaces; pointing them at the financing is a change to those components, not to this
 * one, and is left as its own piece of work rather than half-done here.
 *
 * ── REDEMPTIONS HAS NO TAB ─────────────────────────────────────────────────────────────────────
 * `counts.redemptions` arrives with the record, but no route returns the redemptions themselves.
 * A tab whose only content is its own count is worse than no tab, so it is left out until the
 * list endpoint ships.
 */
export default function FinancingDetailPage() {
  const { t } = useTranslation("financing")
  const { financingId: idParam } = useParams<{ financingId: string }>()
  const financingId = isUuidRouteParam(idParam) ? idParam : undefined
  const [activeTab, setActiveTab] = useState<TabKey>("data")

  const detail = useFinancingDetail(financingId)
  // Only the two case-scoped panels need it, and only for the case type they render against.
  const caseRecord = useCase(detail.data?.case_id)

  if (financingId === undefined) return <NotFoundPage />

  if (detail.isLoading) {
    return (
      <div
        className="p-8 flex flex-col gap-4"
        data-testid="financing-detail-loading"
      >
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="p-8">
        <p
          className="text-sm text-destructive"
          data-testid="financing-detail-error"
        >
          {resolveApiErrorMessage(detail.error, t)}
        </p>
      </div>
    )
  }

  const financing = detail.data

  return (
    <div
      className="p-8 flex flex-col gap-6"
      data-testid="financing-detail-page"
    >
      <header className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {financing.financing_reference}
          </h1>
          <Badge variant="secondary" className="font-normal">
            {t(`kinds.${financing.kind}` as "kinds.single")}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {t("detail.caseId")}{" "}
            <Link
              className="font-medium text-primary hover:underline"
              to={caseDetail(financing.case_id)}
              data-testid="financing-detail-case-link"
            >
              {financing.case_reference}
            </Link>
          </span>
          <Badge variant="outline" className="font-normal">
            {t(`statuses.${financing.status}` as "statuses.active", {
              defaultValue: financing.status,
            })}
          </Badge>
          {/* A financing that has ended says why. "Ran its term" and "redeemed early" are
              different facts, and only the second one explains a balance that went to zero
              ahead of the plan. */}
          {financing.ended_reason !== null &&
            financing.ended_reason !== undefined && (
              <Badge
                variant="secondary"
                className="font-normal"
                data-testid="financing-ended-reason"
              >
                {t(
                  `detail.endedReasons.${financing.ended_reason}` as "detail.endedReasons.terminated"
                )}
              </Badge>
            )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            <Banknote size={15} className="text-muted-foreground" />
            <span className="text-muted-foreground">
              {t("detail.leasingCompany")}
            </span>
            {financing.lc_partner_id !== null ? (
              <Link
                className="font-medium text-primary hover:underline"
                to={partnerDetail(financing.lc_partner_id)}
              >
                {financing.lc_partner_name ?? financing.lc_partner_id}
              </Link>
            ) : (
              <span className="font-medium">—</span>
            )}
          </span>

          <span className="flex items-center gap-1.5">
            <Box size={15} className="text-muted-foreground" />
            <span className="text-muted-foreground">
              {t("detail.productTemplate")}
            </span>
            <span className="font-medium">
              {financing.product_template_name ?? "—"}
            </span>
          </span>

          <span className="flex items-center gap-1.5">
            <FileSignature size={15} className="text-muted-foreground" />
            <span className="text-muted-foreground">
              {t("detail.frameworkAgreement")}
            </span>
            {financing.framework_agreement_id === null ? (
              <span className="font-medium">—</span>
            ) : (
              <Link
                className="font-medium text-primary hover:underline"
                to={frameworkAgreementDetail(financing.framework_agreement_id)}
              >
                {financing.framework_agreement_name ??
                  t("detail.openAgreement")}
              </Link>
            )}
          </span>
        </div>
      </header>

      <UnderlineTabBar
        tabs={TAB_KEYS.map(key => {
          const countKey = COUNT_OF[key]
          const label = t(`detail.tabs.${key}` as "detail.tabs.data")
          return {
            key,
            // The counts come with the record, so the tab bar labels itself without four extra
            // requests — and a count can never disagree with the tab it sits on.
            label:
              countKey === undefined
                ? label
                : `${label} ${financing.counts[countKey]}`,
            testId: `financing-tab-${key}`,
          }
        })}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "data" && <FinancingDataTab financing={financing} />}

      {activeTab === "contracts" && (
        <FinancingContractsPanel caseId={financing.case_id} />
      )}

      {activeTab === "collaterals" && (
        <FinancingCollateralsTab financingId={financing.id} />
      )}

      {activeTab === "covenants" && (
        <ApprovalConditionsPanel caseId={financing.case_id} />
      )}

      {activeTab === "documents" && (
        <CaseDocumentRequirementsPanel
          businessObjectId={financing.case_id}
          caseType={caseRecord.data?.case_type}
        />
      )}

      {activeTab === "activity" && (
        <CaseActivityPanel caseId={financing.case_id} />
      )}
    </div>
  )
}
