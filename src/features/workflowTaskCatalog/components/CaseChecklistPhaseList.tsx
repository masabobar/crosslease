import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, ChevronRight, Minus, Shield } from "lucide-react"
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
  canRoleActOn,
  groupChecklistByPhase,
  isHeldByOpenConditions,
  phaseHeading,
  stepRoles,
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
  /** Open approval conditions — they hold the disbursement step. See `isHeldByOpenConditions`. */
  openConditionCount: number
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
 * ── WHOSE TURN IT IS, RATHER THAN WHAT THE STEP MOVES ──────────────────────────────────────────
 * The 14 Sep final replaced the row's three tags — the blue "commits the request" pill, the freeze
 * tag and a four-eyes badge — with **one role tag**, coloured by whether the reader's own role
 * group may act, and it gates the tick on the same answer. That is the question a checklist row is
 * actually asked: whose turn is this. Four eyes moved onto the task's name as an icon, because it
 * is a property of the task and the badges beside it describe state.
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
  openConditionCount,
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
            openConditionCount={openConditionCount}
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
  openConditionCount,
  currentRole,
  onSetStatus,
}: {
  group: ChecklistPhaseGroup
  defaultOpen: boolean
  canWrite: boolean
  users: readonly UserListItem[]
  openConditionCount: number
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
              canAct={canRoleActOn(item, currentRole)}
              heldByConditions={isHeldByOpenConditions(
                item,
                openConditionCount
              )}
              openConditionCount={openConditionCount}
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
  canAct,
  heldByConditions,
  openConditionCount,
  canWrite,
  users,
  onSetStatus,
}: {
  item: ChecklistItemResponse
  number: number
  canAct: boolean
  heldByConditions: boolean
  openConditionCount: number
  canWrite: boolean
  users: readonly UserListItem[]
  onSetStatus: (item: ChecklistItemResponse) => void
}) {
  const { t } = useTranslation("workflowTaskCatalog")
  const isOpen = item.status === ChecklistItemStatusSchema.enum.open
  const isChecked = item.status === ChecklistItemStatusSchema.enum.checked
  const isNotApplicable =
    item.status === ChecklistItemStatusSchema.enum.not_applicable
  const roles = stepRoles(item)
  // A step another role group owns is readable, not actionable — the dummy disables its tick and
  // says so on the role tag. The backend enforces the same; this stops the user finding out by
  // being refused.
  const isActionable = isOpen && canWrite && canAct && !heldByConditions

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
        disabled={!isActionable}
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
            {/* Four eyes is an icon on the name now, not a badge in the row. It is a property of
                the task rather than a state of it, and as a badge it sat in a line of badges that
                do describe state. */}
            {item.four_eyes && (
              <Shield
                size={14}
                className="ml-1.5 inline shrink-0 align-text-bottom text-muted-foreground"
                aria-label={t("caseChecklist.fourEyesBadge")}
                data-testid={`case-checklist-four-eyes-${item.id}`}
              />
            )}
          </p>

          {/* One role tag, coloured by whether this user's role group may act. The dummy replaced
              the row's three separate tags — the move pill, the freeze tag and a four-eyes badge —
              with this single one, because the question a reader has on a checklist row is whose
              turn it is. */}
          <Badge
            variant={canAct ? "default" : "outline"}
            className="font-normal"
            title={t(
              canAct
                ? "caseChecklist.roleTag.yours"
                : "caseChecklist.roleTag.other"
            )}
            data-testid={`case-checklist-role-${item.id}`}
          >
            {/* One label set already covers both vocabularies — the catalogue's
                TaskResponsibleRole and the platform's UserRole — so either field's value
                resolves, with the raw value as the last resort. */}
            {roles.length === 0
              ? t("caseChecklist.roleTag.anyone")
              : roles
                  .map(role =>
                    t(
                      `detail.taskSheet.responsibleRoles.${role}` as "detail.taskSheet.responsibleRoles.front_office",
                      { defaultValue: role }
                    )
                  )
                  .join(t("caseChecklist.roleTag.or"))}
          </Badge>

          {/* The one place a checklist step is held by something that is not on the checklist, so
              it says so on the row rather than leaving a dead tick. */}
          {heldByConditions && (
            <Badge
              variant="secondary"
              className="font-normal"
              data-testid={`case-checklist-held-${item.id}`}
            >
              {t("caseChecklist.heldByConditions", {
                count: openConditionCount,
              })}
            </Badge>
          )}

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
        {isActionable && (
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
