import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/formatters"
import { resolveUserDisplayName } from "@/features/users/utils"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { CaseChecklistItemStatusBadge } from "@/features/workflowTaskCatalog/components/CaseChecklistStatusBadge"
import { SetChecklistItemStatusDialog } from "@/features/workflowTaskCatalog/components/SetChecklistItemStatusDialog"
import { ChecklistItemStatusSchema } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import {
  groupChecklistByPhase,
  isOwnedByRole,
  phaseHeading,
  responsibleRolesOf,
  taskNumber,
} from "@/features/workflowTaskCatalog/checklistPhases"
import type { ChecklistItemResponse } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { ChecklistPhaseGroup } from "@/features/workflowTaskCatalog/checklistPhases"
import type { UserListItem } from "@/features/users/api/schema"
import type { UserRole } from "@/features/users/types"
import type { CaseProgressResponse } from "@/features/cases/api/schema"

type Props = {
  businessObjectId: string
  items: readonly ChecklistItemResponse[]
  progress: CaseProgressResponse | undefined
  canWrite: boolean
  users: readonly UserListItem[]
}

/**
 * The case checklist as the design draws it: **five phase sections**, each headed
 * `A · Application & credit review` with a `2 open · 3 yours` count, and numbered tasks beneath.
 *
 * It replaces a single flat table. The table was not wrong about any individual task, but it made
 * the two things this screen exists to answer hard to read — which phase the case is working
 * through, and which of its open tasks are mine. Both are counts per phase, and a flat list cannot
 * show either without the reader tallying rows.
 *
 * The phase letter comes from the task code prefix and the name from the case progress; the
 * reasoning, and why `stage_categorization` is *not* the field to group on, is in
 * `checklistPhases.ts`.
 */
export function CaseChecklistPhaseList({
  businessObjectId,
  items,
  progress,
  canWrite,
  users,
}: Props) {
  const { data: currentUser } = useCurrentUser()
  const [activeItem, setActiveItem] = useState<ChecklistItemResponse | null>(
    null
  )

  const groups = groupChecklistByPhase([...items], progress, currentUser?.role)

  return (
    <>
      <div className="flex flex-col gap-6" data-testid="case-checklist-phases">
        {groups.map(group => (
          <PhaseSection
            key={group.letter ?? "unclassified"}
            group={group}
            canWrite={canWrite}
            users={users}
            currentRole={currentUser?.role}
            onSetStatus={setActiveItem}
          />
        ))}
      </div>

      {activeItem && (
        <SetChecklistItemStatusDialog
          businessObjectId={businessObjectId}
          item={activeItem}
          onOpenChange={open => !open && setActiveItem(null)}
        />
      )}
    </>
  )
}

function PhaseSection({
  group,
  canWrite,
  users,
  currentRole,
  onSetStatus,
}: {
  group: ChecklistPhaseGroup
  canWrite: boolean
  users: readonly UserListItem[]
  currentRole: UserRole | undefined
  onSetStatus: (item: ChecklistItemResponse) => void
}) {
  const { t } = useTranslation("workflowTaskCatalog")
  const heading = phaseHeading(group)

  return (
    <section
      className="rounded-lg border"
      data-testid={`case-checklist-phase-${group.letter ?? "unclassified"}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">
          {heading ?? t("caseChecklist.phases.unclassified")}
        </h3>
        {/* The design's count. `yours` is the share of the open tasks this user's role is
            responsible for — it is what tells someone whether the phase is waiting on them. */}
        <span
          className="text-xs text-muted-foreground"
          data-testid={`case-checklist-phase-count-${group.letter ?? "unclassified"}`}
        >
          {t("caseChecklist.phases.count", {
            open: group.openCount,
            yours: group.yoursCount,
          })}
        </span>
      </header>

      <ol className="divide-y">
        {group.items.map((item, index) => {
          const isOpen = item.status === ChecklistItemStatusSchema.enum.open
          const isYours = isOwnedByRole(item, currentRole)

          return (
            <li
              key={item.id}
              className="flex flex-wrap items-start gap-3 px-4 py-3"
              data-testid={`case-checklist-item-${item.id}`}
            >
              <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
                {taskNumber(item, index)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {item.task_name ?? item.task_code ?? item.id}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {item.task_code !== null && <span>{item.task_code}</span>}

                  {/* The role the task belongs to — the design's Front Office / Back Office
                      badge. Rendered from the role set the wire declares, translated, never as the
                      raw wire value. */}
                  {responsibleRolesOf(item).map(role => (
                    <Badge
                      key={role}
                      variant={isYours ? "default" : "outline"}
                      data-testid={`case-checklist-role-${item.id}-${role}`}
                    >
                      {/* One label set already covers both vocabularies — the catalogue's
                          TaskResponsibleRole and the platform's UserRole — so either field's value
                          resolves, with the raw value as the last resort. */}
                      {t(
                        `detail.taskSheet.responsibleRoles.${role}` as "detail.taskSheet.responsibleRoles.front_office",
                        { defaultValue: role }
                      )}
                    </Badge>
                  ))}

                  {item.four_eyes && (
                    <Badge variant="secondary">
                      {t("caseChecklist.fourEyesBadge")}
                    </Badge>
                  )}

                  {!item.is_mandatory && (
                    <span>{t("caseChecklist.mandatory.optional")}</span>
                  )}
                </div>

                {item.checked_at !== null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("caseChecklist.phases.settledBy", {
                      who: resolveUserDisplayName(
                        users,
                        item.checked_by,
                        t("caseChecklist.systemActor")
                      ),
                      when: formatDateTime(item.checked_at),
                    })}
                  </p>
                )}

                {item.note !== null && item.note.trim() !== "" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.note}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <CaseChecklistItemStatusBadge status={item.status} />
                {/* Offered only while the item is open: `set_item_status` accepts
                    OPEN → checked/not_applicable exactly once and then raises
                    WTC_CHECKLIST_ITEM_IMMUTABLE, so a settled task gets no control rather than a
                    button guaranteed to fail. */}
                {canWrite && isOpen && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid={`case-checklist-set-status-${item.id}`}
                    onClick={() => onSetStatus(item)}
                  >
                    {t("caseChecklist.actions.setStatus")}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
