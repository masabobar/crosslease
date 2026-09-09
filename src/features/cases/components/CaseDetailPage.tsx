import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { isUuidRouteParam } from "@/lib/routeParams"
import { useCase } from "@/features/cases/hooks/useCase"
import { useCaseDataMeta } from "@/features/cases/hooks/useCaseDataMeta"
import { useCaseProgress } from "@/features/cases/hooks/useCaseProgress"
import { CaseProgressBand } from "@/features/cases/components/CaseProgressBand"
import { CaseWorkspaceHeader } from "@/features/cases/components/CaseWorkspaceHeader"
import { CaseDocumentRequirementsPanel } from "@/features/documentRequirements/components/CaseDocumentRequirementsPanel"
import { CaseActivityPanel } from "@/features/cases/components/CaseActivityPanel"
import { CaseDecisionDialog } from "@/features/cases/components/CaseDecisionDialog"
import { CaseActionsMenu } from "@/features/cases/components/CaseActionsMenu"
import { CaseStatePanel } from "@/features/cases/components/CaseStatePanel"
import { FinancingContractsPanel } from "@/features/financing/components/FinancingContractsPanel"
import { CaseCollateralPanel } from "@/features/cases/components/CaseCollateralPanel"
import { CaseLeasingCompanyCard } from "@/features/cases/components/CaseLeasingCompanyCard"
import {
  CaseDocumentExtras,
  CaseGeneratedDocumentsPanel,
} from "@/features/cases/components/CaseGeneratedDocumentsPanel"
import { CalculationPanel } from "@/features/financing/components/CalculationPanel"
import { FinancingDataPanel } from "@/features/financing/components/FinancingDataPanel"
import { CaseChecklistPanel } from "@/features/workflowTaskCatalog/components/CaseChecklistPanel"

/**
 * The case workspace.
 *
 * ── DESIGN PROVENANCE ──────────────────────────────────────────────────────────────────────
 * Built from Figma `npZleFhoF9pXP8x1kVCw88` (E1–E3: Ref Request / Financing), frames
 * `Add convenant` (230:11380) and `BO approval` (230:11589): identity header, meta row, progress
 * band, then a seven-tab bar.
 *
 * This replaces the previous single-panel shell, whose own note anticipated exactly this — "when a
 * second section lands a <Tabs> shell can be reintroduced around the panels".
 *
 * ── WHAT IS DELIBERATELY NOT HERE ──────────────────────────────────────────────────────────
 * The design puts a **Covenants** section at the foot of the Checklist tab. It is not built here,
 * and now never will be: **Q-008 was answered on 2026-09-08** — approval conditions belong to the
 * *financing*, not the case, as the spec had it (§5.13, D-37), and the confirmed UI term is
 * **Approval Conditions**, retiring "Covenants". They render on the financing Data tab
 * (`FinancingDataPanel`), which is where the contract carries them.
 *
 * Five tabs have a design but no implementation yet, so they say so rather than rendering an empty
 * shell that reads as "nothing to do here".
 */

const TAB_KEYS = [
  "checklist",
  "calculations",
  "data",
  "contracts",
  "documents",
  "redemption",
  "activity",
] as const

type TabKey = (typeof TAB_KEYS)[number]

// The click dummy's split of the Documents tab. Incoming leads, because what the case owes is what
// holds it up.
const DOCUMENT_SUBTABS = ["incoming", "generated"] as const
type DocumentSubtab = (typeof DOCUMENT_SUBTABS)[number]

// The tabs that have a panel behind them today. Everything else is design-only; keeping the
// list explicit means adding a panel is one edit here rather than a condition to hunt for.
//
// `data` is the design's financing Data tab. It lives here rather than under a route of its own
// because the backend exposes a financing only as a sub-resource of its case — there is no
// `GET /financings` and no `/financings/{id}` — so the case is the only way in.
//
// `contracts` is the design's financing Contracts tab (US 1.34) and lives beside `data` for the
// same reason: both read the case's financing, which has no route of its own.
const IMPLEMENTED_TABS = new Set<TabKey>([
  "checklist",
  "calculations",
  "data",
  "contracts",
  "documents",
  "activity",
])

export default function CaseDetailPage() {
  // US 1.29 — the step-4 decision.
  const [isDecisionOpen, setDecisionOpen] = useState(false)
  const { t } = useTranslation("cases")
  const { caseId: caseIdParam } = useParams<{ caseId: string }>()
  const caseId = isUuidRouteParam(caseIdParam) ? caseIdParam : undefined
  const [activeTab, setActiveTab] = useState<TabKey>("checklist")
  const [docSubtab, setDocSubtab] = useState<DocumentSubtab>("incoming")

  const { data, isLoading, isError, error } = useCase(caseId)
  const progress = useCaseProgress(caseId)
  const dataMeta = useCaseDataMeta(caseId)

  // A param that is not a UUID can never name a case — render not-found rather than firing a request
  // the backend would reject.
  if (caseId === undefined) {
    return <NotFoundPage />
  }

  if (isLoading) {
    return (
      <div
        className="p-8 flex flex-col gap-4"
        data-testid="case-detail-loading"
      >
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive" data-testid="case-detail-error">
          {error?.message ?? t("detail.loadError")}
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col gap-6" data-testid="case-detail-page">
      <CaseWorkspaceHeader
        caseData={data}
        contractCount={dataMeta.data?.contract_count}
        actions={
          <CaseActionsMenu
            caseRecord={data}
            onDecide={() => setDecisionOpen(true)}
          />
        }
      />

      <CaseProgressBand
        progress={progress.data}
        isLoading={progress.isLoading}
      />

      <UnderlineTabBar
        tabs={TAB_KEYS.map(key => ({
          key,
          label: t(`workspace.tabs.${key}` as "workspace.tabs.checklist"),
          testId: `case-tab-${key}`,
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "checklist" && (
        <CaseChecklistPanel businessObjectId={data.id} />
      )}

      {/* The Calculation area (US 1.15) — the authorised surface for the refinancing rate. There
          is deliberately no second financing screen that edits it.

          `FinancingDataPanel` sits here rather than on Data because this is where the dummy puts
          those figures: its Calculations tab is Terms above a Result carrying the instalment, the
          rate, the refinancing ratio, payout to net acquisition cost, interest over the term and
          the present values. Its Data tab carries none of them. They had been opening the Data tab
          off the Figma *financing* Data frame, which is a different screen. */}
      {activeTab === "calculations" && (
        <div className="flex flex-col gap-6">
          <CalculationPanel caseId={data.id} />
          <FinancingDataPanel caseId={data.id} />
        </div>
      )}

      {/* The dummy's Data tab is exactly two cards, side by side: the case's own identity —
          company, agreement, dealer number — and the DAT figure. Nothing else was ever on it. */}
      {activeTab === "data" && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <CaseLeasingCompanyCard caseId={data.id} />
          {/* The design's DAT DATA block — the figure is determined outside the platform and read
              by the approval, not computed here. */}
          <CaseCollateralPanel caseId={data.id} />
        </div>
      )}

      {activeTab === "contracts" && (
        <FinancingContractsPanel caseId={data.id} />
      )}

      {activeTab === "activity" && (
        <div className="flex flex-col gap-6">
          {/* The state read-out sits with the trail, because reading what the case is and reading
              what happened to it are the same job. The transitions themselves moved to the header's
              Actions menu — they were duplicated here and in the header, split by nothing but where
              each had been built. */}
          <CaseStatePanel caseRecord={data} />
          <CaseActivityPanel caseId={data.id} />
        </div>
      )}

      {isDecisionOpen && (
        <CaseDecisionDialog caseId={data.id} onOpenChange={setDecisionOpen} />
      )}

      {activeTab === "documents" && (
        <div className="flex flex-col gap-6">
          {/* The click dummy splits this tab in two — Incoming and Generated — rather than stacking
              them. They answer different questions: what the case still owes, and what the platform
              has produced. Stacked, the second was below the fold of a long requirement table. */}
          <UnderlineTabBar
            tabs={DOCUMENT_SUBTABS.map(key => ({
              key,
              label: t(
                `documents.subtabs.${key}` as "documents.subtabs.incoming"
              ),
              testId: `case-doc-subtab-${key}`,
            }))}
            activeTab={docSubtab}
            onChange={setDocSubtab}
          />

          {docSubtab === "incoming" && (
            /* case_type is the resolution key for the document set (PRD1042-1794 DRC usability);
               the case object is loaded here, so the panel is handed the type rather than
               re-fetching it. */
            <CaseDocumentRequirementsPanel
              businessObjectId={data.id}
              caseType={data.case_type}
              uploadDisabled={data.owner_user_id === null}
              uploadDisabledReason={t("detail.uploadBlockedUnclaimed")}
            />
          )}

          {docSubtab === "generated" && (
            <CaseGeneratedDocumentsPanel caseId={data.id} />
          )}

          {/* Under both sub-tabs, as the newest dummy has it: the OS+ export and the combined
              build act on the case's whole document set, not on either half of it. Hidden from a
              portal user inside the component. */}
          <CaseDocumentExtras caseId={data.id} />
        </div>
      )}

      {!IMPLEMENTED_TABS.has(activeTab) && (
        <Alert data-testid={`case-tab-not-built-${activeTab}`}>
          <AlertTitle>{t("workspace.notBuilt.title")}</AlertTitle>
          <AlertDescription>
            {t("workspace.notBuilt.description")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
