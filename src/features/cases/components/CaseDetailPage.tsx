import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { showApiError } from "@/lib/apiErrorMessage"
import { isUuidRouteParam } from "@/lib/routeParams"
import { useCase } from "@/features/cases/hooks/useCase"
import { useCaseDataMeta } from "@/features/cases/hooks/useCaseDataMeta"
import { useCaseProgress } from "@/features/cases/hooks/useCaseProgress"
import { useClaimCase } from "@/features/cases/hooks/useClaimCase"
import { useRejectCase } from "@/features/cases/hooks/useRejectCase"
import { CaseTypeSchema } from "@/features/cases/api/schema"
import { CaseProgressBand } from "@/features/cases/components/CaseProgressBand"
import { CaseWorkspaceHeader } from "@/features/cases/components/CaseWorkspaceHeader"
import { CaseDocumentRequirementsPanel } from "@/features/documentRequirements/components/CaseDocumentRequirementsPanel"
import { FinancingDataPanel } from "@/features/financing/components/FinancingDataPanel"
import { CaseChecklistPanel } from "@/features/workflowTaskCatalog/components/CaseChecklistPanel"

// Terminal request states for a refinancing-request proposal: once committed or rejected there is
// nothing left to claim or reject, so the header actions are hidden (the backend 409s either way).
const TERMINAL_DISPLAY_STATUSES = new Set(["committed", "rejected"])

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
 * The design also puts a **Covenants** section at the foot of the Checklist tab. It is not built,
 * because where those live is an open conflict: the design says the case, the spec says the
 * financing — "one object, on the financing, not the case … section 5 of nine on the financing
 * screen" (§5.13, D-37) — and the design's own financing Data tab carries no such section. Building
 * either placement now means rebuilding US 1.21 later. Tracked as Q-008.
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

// The tabs that have a panel behind them today. Everything else is design-only; keeping the
// list explicit means adding a panel is one edit here rather than a condition to hunt for.
//
// `data` is the design's financing Data tab. It lives here rather than under a route of its own
// because the backend exposes a financing only as a sub-resource of its case — there is no
// `GET /financings` and no `/financings/{id}` — so the case is the only way in.
const IMPLEMENTED_TABS = new Set<TabKey>(["checklist", "data", "documents"])

export default function CaseDetailPage() {
  const { t } = useTranslation("cases")
  const { caseId: caseIdParam } = useParams<{ caseId: string }>()
  const caseId = isUuidRouteParam(caseIdParam) ? caseIdParam : undefined
  const [activeTab, setActiveTab] = useState<TabKey>("checklist")

  const { data, isLoading, isError, error } = useCase(caseId)
  const progress = useCaseProgress(caseId)
  const dataMeta = useCaseDataMeta(caseId)
  const claimCase = useClaimCase()
  const rejectCase = useRejectCase()

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

  const canActOnProposal =
    data.owner_user_id === null &&
    !TERMINAL_DISPLAY_STATUSES.has(data.display_status)

  return (
    <div className="p-8 flex flex-col gap-6" data-testid="case-detail-page">
      <CaseWorkspaceHeader
        caseData={data}
        contractCount={dataMeta.data?.contract_count}
        actions={
          canActOnProposal ? (
            <div className="flex items-center gap-2">
              {/* Reject only applies to a refinancing request (the only type with a request
                  status); the backend enforces the same, this just hides a control that would 409. */}
              {data.case_type === CaseTypeSchema.enum.refinancing_request && (
                <Button
                  variant="outline"
                  data-testid="case-reject-button"
                  disabled={rejectCase.isPending || claimCase.isPending}
                  onClick={() =>
                    rejectCase.mutate(data.id, {
                      onSuccess: () => toast.success(t("detail.rejectSuccess")),
                      onError: err => showApiError(err, t),
                    })
                  }
                >
                  {t("detail.reject")}
                </Button>
              )}
              <Button
                data-testid="case-take-over-button"
                disabled={claimCase.isPending || rejectCase.isPending}
                onClick={() =>
                  claimCase.mutate(data.id, {
                    onSuccess: () => toast.success(t("detail.takeOverSuccess")),
                    onError: err => showApiError(err, t),
                  })
                }
              >
                {t("detail.takeOver")}
              </Button>
            </div>
          ) : undefined
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

      {activeTab === "data" && <FinancingDataPanel caseId={data.id} />}

      {activeTab === "documents" && (
        /* case_type is the resolution key for the document set (PRD1042-1794 DRC usability); the case
           object is loaded here, so the panel is handed the type rather than re-fetching it. */
        <CaseDocumentRequirementsPanel
          businessObjectId={data.id}
          caseType={data.case_type}
          uploadDisabled={data.owner_user_id === null}
          uploadDisabledReason={t("detail.uploadBlockedUnclaimed")}
        />
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
