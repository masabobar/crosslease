import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { isUuidRouteParam } from "@/lib/routeParams"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { CaseChecklistPanel } from "@/features/workflowTaskCatalog/components/CaseChecklistPanel"

/**
 * The runtime half of the Workflow Task Catalog — CR PRD1042-1554 items B5–B8, FE sub-task
 * PRD1042-1556: the checklist that sits on a case, and the phase gates over it.
 *
 * ── DESIGN PROVENANCE ──────────────────────────────────────────────────────────────────────
 * NOTE: this surface was NOT built from a Figma frame. None exists. Figma
 * `xBr4KUN3dnZlsdEalgjHwK` holds three pages — catalogue list + create, catalogue detail, and the
 * migration wizard — and has never carried a case-checklist or phase-gate frame. The layout is
 * **derived**, on explicit instruction, from the design language already shipped in this feature:
 * the bordered rounded table of `TaskDefinitionsTab`, the tinted status pill of
 * `WorkflowTaskCatalogStateBadge`, and the dialog shell of `CreateWorkflowTaskCatalogDialog`.
 * Treat it as an interpretation, not as design-verified.
 *
 * Do not read the rest of that Figma file as scope: it also contains four-eyes submit/review,
 * deprecate/archive, and the migration wizard, all of which this CR cut.
 *
 * ── REACHABILITY ───────────────────────────────────────────────────────────────────────────
 * This route stays as the standalone deep link it has always been, and is deliberately absent from
 * the sidebar. The primary way in is now the case workspace's Checklist tab
 * (`features/cases/components/CaseDetailPage.tsx`), which mounts the same `CaseChecklistPanel`.
 * Both surfaces therefore render identical behaviour; only the page chrome differs.
 */
export default function CaseChecklistPage() {
  const { t } = useTranslation("workflowTaskCatalog")
  const { businessObjectId: businessObjectIdParam } = useParams<{
    businessObjectId: string
  }>()
  const businessObjectId = isUuidRouteParam(businessObjectIdParam)
    ? businessObjectIdParam
    : undefined

  // A param that is not a UUID can never name a case — render not-found rather than firing three
  // requests the backend would reject.
  if (businessObjectId === undefined) {
    return <NotFoundPage />
  }

  return (
    <div className="p-8 flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium text-foreground">
          {t("caseChecklist.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("caseChecklist.subtitle")}
        </p>
      </div>

      <CaseChecklistPanel businessObjectId={businessObjectId} />
    </div>
  )
}
