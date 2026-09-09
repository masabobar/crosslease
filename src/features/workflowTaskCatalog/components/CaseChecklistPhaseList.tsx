import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  Minus,
  Shield,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
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
import {
  isFreezingStep,
  stepMoveFor,
} from "@/features/workflowTaskCatalog/checklistStepMoves"
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
 * The case checklist as the click dummy draws it: **five collapsible phase sections**, each headed
 * `A · Application & credit review` with a `2/3 resolved · 1 open` count, and numbered tasks beneath.
 *
 * ── WHY IT COLLAPSES, AND WHY ONLY THE FIRST PHASE IS OPEN ─────────────────────────────────────
 * 41 steps expanded at once is four screens of scrolling, and the two questions this tab exists to
 * answer — which phase the case is in, and what is still open in it — are both answered by the five
 * header rows alone. So the phases arrive collapsed with the first one open, exactly as the dummy
 * does, and a reader opens the phase they are working in rather than scrolling past the four they
 * are not.
 *
 * `Collapsible` rather than `Accordion`: several phases are legitimately open at once, and the rows
 * change height in place (resolving a task adds its "settled by" line), which the accordion
 * primitive's measured `--accordion-panel-height` panel would clip until the next layout pass.
 *
 * The phase letter comes from the task code prefix and the name from the case progress; the
 * reasoning, and why `stage_categorization` is *not* the field to group on, is in
 * `checklistPhases.ts`. What a step *moves* is in `checklistStepMoves.ts`.
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
      <div className="flex flex-col gap-3" data-testid="case-checklist-phases">
        {groups.map((group, index) => (
          <PhaseSection
            key={group.letter ?? "unclassified"}
            group={group}
            // Only the first phase arrives open. Keyed on position rather than on the letter `A`
            // so a case whose earlier phases are absent still opens its first *rendered* section
            // instead of none.
            defaultOpen={index === 0}
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
  defaultOpen,
  canWrite,
  users,
  currentRole,
  onSetStatus,
}: {
  group: ChecklistPhaseGroup
  defaultOpen: boolean
  canWrite: boolean
  users: readonly UserListItem[]
  currentRole: UserRole | undefined
  onSetStatus: (item: ChecklistItemResponse) => void
}) {
  const { t } = useTranslation("workflowTaskCatalog")
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const heading = phaseHeading(group)
  const key = group.letter ?? "unclassified"

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-lg border"
      data-testid={`case-checklist-phase-${key}`}
    >
      <CollapsibleTrigger
        className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left"
        data-testid={`case-checklist-phase-toggle-${key}`}
      >
        {isOpen ? (
          <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
        )}
        <h3 className="flex-1 text-sm font-semibold">
          {heading ?? t("caseChecklist.phases.unclassified")}
        </h3>
        {/* The dummy's count: how much of the phase is settled, and how much is still open.
            "Resolved" covers not-applicable as well as checked — see ChecklistPhaseGroup. */}
        <span
          className="text-xs text-muted-foreground"
          data-testid={`case-checklist-phase-count-${key}`}
        >
          {group.openCount > 0
            ? t("caseChecklist.phases.countWithOpen", {
                resolved: group.resolvedCount,
                total: group.totalCount,
                open: group.openCount,
              })
            : t("caseChecklist.phases.countResolved", {
                resolved: group.resolvedCount,
                total: group.totalCount,
              })}
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <ol className="divide-y border-t">
          {group.items.map((item, index) => (
            <TaskRow
              key={item.id}
              item={item}
              number={taskNumber(item, index)}
              isYours={isOwnedByRole(item, currentRole)}
              canWrite={canWrite}
              users={users}
              onSetStatus={onSetStatus}
            />
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  )
}

function TaskRow({
  item,
  number,
  isYours,
  canWrite,
  users,
  onSetStatus,
}: {
  item: ChecklistItemResponse
  number: number
  isYours: boolean
  canWrite: boolean
  users: readonly UserListItem[]
  onSetStatus: (item: ChecklistItemResponse) => void
}) {
  const { t } = useTranslation("workflowTaskCatalog")
  const isOpen = item.status === ChecklistItemStatusSchema.enum.open
  const isChecked = item.status === ChecklistItemStatusSchema.enum.checked
  const isNotApplicable =
    item.status === ChecklistItemStatusSchema.enum.not_applicable
  const move = stepMoveFor(item.task_code)

  return (
    <li
      className={cn(
        "flex flex-wrap items-start gap-3 px-4 py-3",
        isNotApplicable && "opacity-60"
      )}
      data-testid={`case-checklist-item-${item.id}`}
    >
      {/* The dummy's round tick. It is the row's own affordance when the task is open and
          writable, and the settled mark otherwise — `set_item_status` accepts a resolution exactly
          once, so a settled task gets a filled, disabled circle rather than a live control. */}
      <Button
        type="button"
        variant={isChecked ? "default" : "outline"}
        size="icon"
        className={cn(
          "mt-0.5 size-5 shrink-0 rounded-full",
          isNotApplicable && "border-dashed"
        )}
        disabled={!isOpen || !canWrite}
        aria-label={t("caseChecklist.actions.setStatus")}
        data-testid={`case-checklist-tick-${item.id}`}
        onClick={() => onSetStatus(item)}
      >
        {isChecked && <Check size={12} />}
        {isNotApplicable && <Minus size={12} />}
      </Button>

      <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
        {number}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn("text-sm", isNotApplicable && "line-through")}
            data-testid={`case-checklist-item-name-${item.id}`}
          >
            {item.task_name ?? item.task_code ?? item.id}
          </p>

          {/* What resolving this step sets in motion — the dummy's blue pill. The tooltip carries
              the consequence, which is the part the step's own wording never says. */}
          {move !== null && (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/5 font-normal text-primary"
              title={t(
                `caseChecklist.stepMoves.${move}.note` as "caseChecklist.stepMoves.commitsRequest.note"
              )}
              data-testid={`case-checklist-move-${item.id}`}
            >
              <TrendingUp size={12} />
              {t(
                `caseChecklist.stepMoves.${move}.label` as "caseChecklist.stepMoves.commitsRequest.label"
              )}
            </Badge>
          )}

          {isFreezingStep(item.task_code) && (
            <Badge
              variant="outline"
              className="font-normal"
              data-testid={`case-checklist-freezes-${item.id}`}
            >
              <Lock size={12} />
              {t("caseChecklist.freezesBadge")}
            </Badge>
          )}

          {item.four_eyes && (
            <Badge variant="secondary" className="font-normal">
              <Shield size={12} />
              {t("caseChecklist.fourEyesBadge")}
            </Badge>
          )}

          {/* The role the task belongs to — the design's Front Office / Back Office badge.
              Rendered from the role set the wire declares, translated, never as the raw value. */}
          {responsibleRolesOf(item).map(role => (
            <Badge
              key={role}
              variant={isYours ? "default" : "outline"}
              className="font-normal"
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

          {!item.is_mandatory && (
            <span className="text-xs text-muted-foreground">
              {t("caseChecklist.mandatory.optional")}
            </span>
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
          <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
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
}
