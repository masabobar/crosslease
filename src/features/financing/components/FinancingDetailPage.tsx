import { useState } from "react"
import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
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
import { useCase } from "@/features/cases/hooks/useCase"
import { usePartnerDetail } from "@/features/partners/hooks/usePartnerDetail"
import { useCaseProductTemplate } from "@/features/cases/hooks/useCaseProductTemplate"
import { CaseActivityPanel } from "@/features/cases/components/CaseActivityPanel"
import { CaseDocumentRequirementsPanel } from "@/features/documentRequirements/components/CaseDocumentRequirementsPanel"
import { useFinancingOverview } from "@/features/financing/hooks/useFinancingOverview"
import { FinancingContractsPanel } from "@/features/financing/components/FinancingContractsPanel"
import { FinancingDataPanel } from "@/features/financing/components/FinancingDataPanel"

const TAB_KEYS = ["data", "contracts", "documents", "activity"] as const
type TabKey = (typeof TAB_KEYS)[number]

/**
 * The financing workspace.
 *
 * ── WHY THE ROUTE IS KEYED ON THE CASE ─────────────────────────────────────────────────────────
 * There is no `GET /financings/{id}`. Every endpoint this screen reads — the overview, the
 * remaining balance, the per-contract split, the conditions, the activity — hangs off
 * `/cases/{case_id}/financing/…`, so the case id is not a detail about the financing, it is the
 * financing's address. The list row carries it, and the URL says so rather than pretending to an
 * id the API cannot resolve.
 *
 * The header still leads with the financing's own reference, because that is what the reader
 * clicked on and what they are looking at.
 *
 * ── WHAT THE PROTOTYPE'S DATA TAB HAS THAT THIS DOES NOT ───────────────────────────────────────
 * Its repayment schedule table (value date / payment / principal / interest / closing balance) and
 * the Sollbelastung–Habenbelastung pair. Neither is on the financing overview or the remaining
 * balance; the instalment plan the API does expose is per contract, not per financing. They are
 * left out rather than computed here — an amortisation table the UI derives is a second answer
 * that can disagree with the bank's.
 */
export default function FinancingDetailPage() {
  const { t } = useTranslation("financing")
  const { caseId: caseIdParam } = useParams<{ caseId: string }>()
  const caseId = isUuidRouteParam(caseIdParam) ? caseIdParam : undefined
  const [activeTab, setActiveTab] = useState<TabKey>("data")

  const overview = useFinancingOverview(caseId)
  const caseRecord = useCase(caseId)
  // `CaseResponse` carries the LC's id but not its name — that denormalisation is on the LIST
  // item — so the name comes from the registry, the same way every other LC link in the app
  // resolves it.
  const lcPartner = usePartnerDetail(overview.data?.lc_partner_id ?? null)
  const productTemplate = useCaseProductTemplate(caseId)

  // A param that is not a UUID can never name a case — render not-found rather than firing a
  // request the backend would reject.
  if (caseId === undefined) return <NotFoundPage />

  if (overview.isLoading) {
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

  if (overview.isError || !overview.data) {
    return (
      <div className="p-8">
        <p
          className="text-sm text-destructive"
          data-testid="financing-detail-error"
        >
          {resolveApiErrorMessage(overview.error, t)}
        </p>
      </div>
    )
  }

  const financing = overview.data

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
          {/* The case is named rather than hidden: it is where the financing came from and, for
              every action, where it is still worked. */}
          <span className="text-sm text-muted-foreground">
            {t("detail.caseId")}{" "}
            <Link
              className="font-medium text-primary hover:underline"
              to={caseDetail(caseId)}
              data-testid="financing-detail-case-link"
            >
              {caseRecord.data?.case_reference ?? "—"}
            </Link>
          </span>
          <Badge variant="outline" className="font-normal">
            {t(`statuses.${financing.status}` as "statuses.active", {
              defaultValue: financing.status,
            })}
          </Badge>
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
                {lcPartner.data?.display_name ?? financing.lc_partner_id}
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
            {/* The overview carries the template's id, not its name — the case's own binding is
                where the name lives, so a raw UUID never reaches the header. */}
            {/* The overview carries the template's id, not its name — the case's own binding is
                where the name lives, so a raw UUID never reaches the header. A case that has not
                bound one yet reads as a dash rather than as a permanent ellipsis. */}
            <span className="font-medium">
              {productTemplate.isLoading
                ? "…"
                : (productTemplate.data?.template_name ?? "—")}
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
                {t("detail.openAgreement")}
              </Link>
            )}
          </span>
        </div>
      </header>

      <UnderlineTabBar
        tabs={TAB_KEYS.map(key => ({
          key,
          label: t(`detail.tabs.${key}` as "detail.tabs.data"),
          testId: `financing-tab-${key}`,
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* The balance banner, the repayment card and the pricing card are all this panel, built
          against the same endpoints. Drawing a second banner above it showed the same two figures
          twice — and the panel is the one that also carries the "figures still calculating"
          notice, which is the thing a reader must not miss. */}
      {activeTab === "data" && <FinancingDataPanel caseId={caseId} />}

      {activeTab === "contracts" && <FinancingContractsPanel caseId={caseId} />}

      {activeTab === "documents" && (
        <CaseDocumentRequirementsPanel
          businessObjectId={caseId}
          caseType={caseRecord.data?.case_type}
        />
      )}

      {activeTab === "activity" && <CaseActivityPanel caseId={caseId} />}
    </div>
  )
}
