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
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

/**
 * The runtime checklist of one case, as a panel: the item table, the phase gates, and
 * the phase gates.
 *
 * Extracted from `CaseChecklistPage` so two surfaces can render the same thing — the standalone
 * deep-link route (which still owns the page chrome and reads the route param) and the case
 * workspace's Checklist tab. The panel takes the business object id as a prop and renders no page
 * padding or title, so the host decides its own layout.
 *
 * ── WHO MAY ACT ON AN ITEM ─────────────────────────────────────────────────────────────────
 * CR PRD1042-1792 item 6 wants a worker to act only on items carrying their own responsible role.
 * That is enforced on the server: an item carries `responsible_roles` and the runtime service
 * refuses an actor whose platform role is not among them (`WTC_CHECKLIST_ROLE_NOT_PERMITTED`).
 * This panel deliberately does not filter or hide anything — PRD1042-1892 item 13 is explicit that
 * a bank worker sees the complete checklist of a case and that this must not become a visibility
 * filter, because hiding a control is never the security boundary. The refusal surfaces as an error
 * on the action, not as a missing row.
 */

type Props = {
  businessObjectId: string
}

export function CaseChecklistPanel({ businessObjectId }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const { data: currentUser } = useCurrentUser()

  const {
    data: items,
    isLoading,
    isError,
    error,
  } = useCaseChecklist(businessObjectId)
  const { isError: isProjectionError, error: projectionError } =
    useCaseRequiredProjection(businessObjectId)
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
      <div className="flex flex-col gap-4" data-testid="case-checklist-loading">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // A case with nothing materialized is a 404 (WTC_CHECKLIST_NOT_FOUND), not an empty array —
  // `get_case_checklist` treats an empty list as absent. So that one code gets a real empty state
  // instead of an error, and every other code falls through to the dynamic error lookup.
  if (
    isError &&
    error instanceof ApiError &&
    error.code === "WTC_CHECKLIST_NOT_FOUND"
  ) {
    return (
      <Alert data-testid="case-checklist-empty">
        <AlertTitle>{t("caseChecklist.empty.title")}</AlertTitle>
        <AlertDescription>
          {t("caseChecklist.empty.description")}
        </AlertDescription>
      </Alert>
    )
  }

  if (isError || !items) {
    return (
      <p
        data-testid="case-checklist-error"
        className="text-sm text-destructive py-8 text-center"
      >
        {resolveApiErrorMessage(error, t)}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8" data-testid="case-checklist-panel">
      {/* The outstanding-required banner was removed on request: the Details-page design's
          Checklist tab carries no such block, and the same information is already on the rows —
          each open required task shows its own status and its Complete-or-waive action. What is
          kept is the projection *error*, which is a different thing: it means the readiness of the
          case could not be determined at all, and silence there would read as "nothing is
          outstanding". */}
      {isProjectionError && (
        <Alert
          variant="destructive"
          data-testid="case-checklist-projection-error"
        >
          <AlertTitle>{t("caseChecklist.projectionError.title")}</AlertTitle>
          <AlertDescription>
            <p>{t("caseChecklist.projectionError.description")}</p>
            <p className="mt-2">{resolveApiErrorMessage(projectionError, t)}</p>
          </AlertDescription>
        </Alert>
      )}

      <CaseChecklistTable
        businessObjectId={businessObjectId}
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
            {resolveApiErrorMessage(gatesError, t)}
          </p>
        ) : (
          <CasePhaseGatePanel
            businessObjectId={businessObjectId}
            gates={gates ?? []}
            canDecide={canDecideGate}
            users={users}
          />
        )}
      </div>
    </div>
  )
}
