import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useUsers } from "@/features/users/hooks/useUsers"
import { CaseChecklistTable } from "@/features/workflowTaskCatalog/components/CaseChecklistTable"
import { CasePhaseGatePanel } from "@/features/workflowTaskCatalog/components/CasePhaseGatePanel"
import { useCaseChecklist } from "@/features/workflowTaskCatalog/hooks/useCaseChecklist"
import { useCaseRequiredProjection } from "@/features/workflowTaskCatalog/hooks/useCaseRequiredProjection"
import { useCasePhaseGates } from "@/features/workflowTaskCatalog/hooks/useCasePhaseGates"
import {
  CASE_CHECKLIST_WRITE_ALLOWED_ROLES,
  CASE_PHASE_GATE_DECIDE_ALLOWED_ROLES,
} from "@/features/workflowTaskCatalog/types"
import { ChecklistItemStatusSchema } from "@/features/workflowTaskCatalog/api/runtimeSchema"

/**
 * The runtime half of the Workflow Task Catalog — CR PRD1042-1554 items B5–B8, FE sub-task
 * PRD1042-1556: the checklist that sits on a case, and the phase gates over it.
 *
 * ── DESIGN PROVENANCE ──────────────────────────────────────────────────────────────────────
 * NOTE: this surface was NOT built from a Figma frame. None exists. Figma
 * `xBr4KUN3dnZlsdEalgjHwK` holds three pages — catalogue list + create, catalogue detail, and the
 * migration wizard — and has never carried a case-checklist or phase-gate frame (open-questions.md
 * Q-040). The layout here is **derived**, on explicit instruction, from the design language already
 * shipped in this feature: the bordered rounded table of `TaskDefinitionsTab`, the tinted status
 * pill of `WorkflowTaskCatalogStateBadge`, and the dialog shell of
 * `CreateWorkflowTaskCatalogDialog`. Treat it as an interpretation, not as design-verified — if a
 * frame is supplied later, expect fidelity corrections.
 *
 * Do not read the rest of that Figma file as scope: it also contains four-eyes submit/review,
 * deprecate/archive, and the migration wizard, all of which this CR cut.
 *
 * ── REACHABILITY ───────────────────────────────────────────────────────────────────────────
 * `business_object_id` comes from the route, because no case entity exists in this app yet — there
 * is no refinancing-request, financing or redemption module to link from, and the five runtime
 * endpoints are the only `/cases/…` routes in the API (CR B4, 1790 B4). So this route is the
 * interim entry point: real, param-driven, and wired to live endpoints, but not yet linked from
 * anywhere. It is deliberately absent from the sidebar — inventing navigation for a case that
 * cannot be listed would be the decorative surface `api-first.md` §4 forbids.
 *
 * ── WHAT THIS SURFACE CANNOT DO ────────────────────────────────────────────────────────────
 * CR PRD1042-1792 item 6 wants a worker to act only on items carrying their own responsible role.
 * `ChecklistItemResponse` has no `responsible_role` (1790 B7 / Q-052), so every holder of the
 * runtime write role can action every item. That gap is left visible rather than papered over with
 * a guessed role mapping.
 */
export default function CaseChecklistPage() {
  const { t } = useTranslation("workflowTaskCatalog")
  const { businessObjectId } = useParams<{ businessObjectId: string }>()
  const { data: currentUser } = useCurrentUser()

  const {
    data: items,
    isLoading,
    isError,
    error,
  } = useCaseChecklist(businessObjectId)
  const { data: projection } = useCaseRequiredProjection(businessObjectId)
  const {
    data: gates,
    isError: isGatesError,
    error: gatesError,
  } = useCasePhaseGates(businessObjectId)

  // Generous page size for the same reason the catalogue detail page uses one: `checked_by` and
  // `gate_approver` are bare UUIDs, and an actor outside the fetched page falls back to the raw id.
  const { data: usersData } = useUsers({ per_page: 100 })
  const users = usersData?.users ?? []

  const canWrite = Boolean(
    currentUser?.role &&
    CASE_CHECKLIST_WRITE_ALLOWED_ROLES.includes(currentUser.role)
  )
  // Narrower than the backend on purpose — see CASE_PHASE_GATE_DECIDE_ALLOWED_ROLES in types.ts.
  const canDecideGate = Boolean(
    currentUser?.role &&
    CASE_PHASE_GATE_DECIDE_ALLOWED_ROLES.includes(currentUser.role)
  )

  if (isLoading) {
    return (
      <div
        className="p-8 flex flex-col gap-4"
        data-testid="case-checklist-loading"
      >
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // A case with nothing materialized is a 404 (WTC_CHECKLIST_NOT_FOUND), not an empty array —
  // `get_case_checklist` treats an empty list as absent. So that one code gets a real empty state
  // instead of an error, and every other code falls through to the dynamic error lookup.
  if (isError && error instanceof ApiError) {
    if (error.code === "WTC_CHECKLIST_NOT_FOUND") {
      return (
        <div className="p-8">
          <Alert data-testid="case-checklist-empty">
            <AlertTitle>{t("caseChecklist.empty.title")}</AlertTitle>
            <AlertDescription>
              {t("caseChecklist.empty.description")}
            </AlertDescription>
          </Alert>
        </div>
      )
    }
  }

  if (isError || !items) {
    return (
      <div className="p-8">
        <p
          data-testid="case-checklist-error"
          className="text-sm text-destructive py-8 text-center"
        >
          {error instanceof ApiError
            ? t(`errors.${error.code}` as "errors.generic", {
                defaultValue: t("errors.generic"),
              })
            : t("errors.generic")}
        </p>
      </div>
    )
  }

  // CR item 7 — a blocked submission has to say what is outstanding. The projection filters on
  // is_mandatory alone; it cannot filter by gating stage, because the case item carries neither
  // the process contexts nor the stage (1790 B2 / Q-052). So this names every outstanding required
  // task rather than only those blocking one particular gate, and says so.
  const outstandingRequired = (projection?.required_items ?? []).filter(
    item => item.status === ChecklistItemStatusSchema.enum.open
  )
  const isBlocked = projection ? !projection.all_required_done : false

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

      {isBlocked && (
        <Alert variant="destructive" data-testid="case-checklist-blocked">
          <AlertTitle>{t("caseChecklist.blocked.title")}</AlertTitle>
          <AlertDescription>
            <p>{t("caseChecklist.blocked.description")}</p>
            <ul className="mt-2 list-disc pl-4">
              {outstandingRequired.map(item => (
                <li
                  key={item.id}
                  data-testid={`case-checklist-outstanding-${item.id}`}
                >
                  {item.task_name ?? item.task_code ?? item.id}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <CaseChecklistTable
        businessObjectId={businessObjectId as string}
        items={items}
        canWrite={canWrite}
        users={users}
      />

      <div>
        {isGatesError ? (
          <p
            data-testid="case-phase-gates-error"
            className="text-sm text-destructive"
          >
            {gatesError instanceof ApiError
              ? t(`errors.${gatesError.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")}
          </p>
        ) : (
          <CasePhaseGatePanel
            businessObjectId={businessObjectId as string}
            gates={gates ?? []}
            canDecide={canDecideGate}
            users={users}
          />
        )}
      </div>
    </div>
  )
}
