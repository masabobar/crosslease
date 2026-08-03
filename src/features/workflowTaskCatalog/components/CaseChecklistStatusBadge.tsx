import { useTranslation } from "react-i18next"
import {
  ChecklistItemStatusSchema,
  PhaseGateStatusSchema,
} from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type {
  ChecklistItemStatus,
  PhaseGateStatus,
} from "@/features/workflowTaskCatalog/api/runtimeSchema"

// Palette follows WorkflowTaskCatalogStateBadge: soft-tinted pill, green for a settled/approved
// state, muted for a neutral one, destructive for a rejection.
const ITEM_STATUS_CLASSES: Record<ChecklistItemStatus, string> = {
  [ChecklistItemStatusSchema.enum.open]: "bg-amber-600/10 text-amber-700",
  [ChecklistItemStatusSchema.enum.checked]: "bg-green-600/10 text-green-600",
  [ChecklistItemStatusSchema.enum.not_applicable]:
    "bg-muted text-muted-foreground",
}

const GATE_STATUS_CLASSES: Record<PhaseGateStatus, string> = {
  [PhaseGateStatusSchema.enum.open]: "bg-amber-600/10 text-amber-700",
  [PhaseGateStatusSchema.enum.in_review]: "bg-sky-600/10 text-sky-700",
  [PhaseGateStatusSchema.enum.approved]: "bg-green-600/10 text-green-600",
  [PhaseGateStatusSchema.enum.rejected]: "bg-destructive/10 text-destructive",
}

const PILL_CLASSES =
  "inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"

function CaseChecklistItemStatusBadge({
  status,
}: {
  status: ChecklistItemStatus
}) {
  const { t } = useTranslation("workflowTaskCatalog")

  return (
    <span
      data-testid={`checklist-item-status-badge-${status}`}
      className={`${PILL_CLASSES} ${ITEM_STATUS_CLASSES[status]}`}
    >
      {t(
        `caseChecklist.itemStatuses.${status}` as "caseChecklist.itemStatuses.open"
      )}
    </span>
  )
}

function CasePhaseGateStatusBadge({ status }: { status: PhaseGateStatus }) {
  const { t } = useTranslation("workflowTaskCatalog")

  return (
    <span
      data-testid={`phase-gate-status-badge-${status}`}
      className={`${PILL_CLASSES} ${GATE_STATUS_CLASSES[status]}`}
    >
      {t(
        `caseChecklist.gateStatuses.${status}` as "caseChecklist.gateStatuses.open"
      )}
    </span>
  )
}

export { CaseChecklistItemStatusBadge, CasePhaseGateStatusBadge }
