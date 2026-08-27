import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, File, Plus, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableEmptyState } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import { STATUS_PILL_CLASSES } from "@/features/workflowTaskCatalog/constants"
import { TaskDefinitionSheet } from "@/features/workflowTaskCatalog/components/TaskDefinitionSheet"
import { CatalogStagesPanel } from "@/features/workflowTaskCatalog/components/CatalogStagesPanel"
import { useGlobalDefaultTasks } from "@/features/workflowTaskCatalog/hooks/useGlobalDefaultTasks"
import { useTenantDocumentRequirements } from "@/features/documentRequirements/hooks/useTenantDocumentRequirements"
import {
  CatalogLayerSchema,
  LayerActionSchema,
  TaskApplicabilitySchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type {
  CatalogEntityType,
  CatalogLayer,
  LayerAction,
  TaskDefinitionItem,
} from "@/features/workflowTaskCatalog/api/schema"

const TYPE_BADGE_CLASSES: Record<LayerAction, string> = {
  [LayerActionSchema.enum.defined]: "bg-sky-600/10 text-sky-600",
  [LayerActionSchema.enum.override]: "bg-lime-600/10 text-lime-700",
  [LayerActionSchema.enum.deactivated]: "bg-muted text-muted-foreground",
  [LayerActionSchema.enum.supplement]: "bg-purple-600/10 text-purple-600",
}

function TypeBadge({ layerAction }: { layerAction: LayerAction }) {
  const { t } = useTranslation("workflowTaskCatalog")
  return (
    <span className={cn(STATUS_PILL_CLASSES, TYPE_BADGE_CLASSES[layerAction])}>
      {t(`detail.taskDefinitions.types.${layerAction}`)}
    </span>
  )
}

// An override row carries both its own value and the Global Default it replaces. Showing them
// together is what US 15.23 asks for and what makes CR B3/B4 visible: a reader can tell which
// values are inherited and which the product changed.
function OverrideValue({
  own,
  inherited,
}: {
  own: React.ReactNode
  inherited: React.ReactNode | null
}) {
  if (inherited === null) return <>{own}</>
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-foreground">{own}</span>
      <span className="text-xs text-muted-foreground line-through">
        {inherited}
      </span>
    </span>
  )
}

type SheetState =
  | { mode: "view" | "edit"; task: TaskDefinitionItem }
  | { mode: "add"; task: null; defaultLayerAction: LayerAction }
  | null

type Props = {
  catalogId: string
  // Null means the catalogue has no active version, so no task request can be built — the
  // caller already forces canEdit false in that case.
  versionId: string | null
  catalogLayer: CatalogLayer
  entityType: CatalogEntityType | null
  // US 15.7: document requirements are resolved per tenant, which is the scope the BE validates
  // a task's doc_requirement_ref against.
  tenantId: string
  tasks: TaskDefinitionItem[]
  canEdit: boolean
}

function TaskDefinitionsTab({
  catalogId,
  versionId,
  catalogLayer,
  entityType,
  tenantId,
  tasks,
  canEdit,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const [sheetState, setSheetState] = useState<SheetState>(null)
  const notApplicable = t("detail.taskDefinitions.notApplicable")
  // Shares one request with the sheet through the query cache — same key, same tenant.
  const { data: documentRequirements } = useTenantDocumentRequirements(tenantId)
  const isGlobalDefaultLayer =
    catalogLayer === CatalogLayerSchema.enum.global_default
  // Same key as the sheet's own call, so this costs no extra request — and reading it here warms
  // the cache before "+ Add task" is ever pressed, which is what lets the action below be
  // resolved from settled data rather than guessed.
  const { data: globalDefaultTasks } = useGlobalDefaultTasks(
    isGlobalDefaultLayer ? null : entityType
  )

  // A task carries only the requirement's UUID, so the code has to be resolved. An id outside the
  // fetched page falls back to the raw UUID rather than rendering blank, so it stays diagnosable.
  const requirementCodeById = new Map(
    (documentRequirements ?? []).map(r => [r.id, r.requirement_code])
  )
  function documentRequirementCode(ref: string): string {
    return requirementCodeById.get(ref) ?? ref
  }

  // `task_number` is the server-assigned step number and the order the bank reads the catalogue
  // in, so it wins where both rows have one. `display_order` remains the tie-break and the only
  // ordering for rows created before task numbers existed.
  const orderedTasks = [...tasks].sort((a, b) => {
    if (a.task_number !== null && b.task_number !== null) {
      return a.task_number - b.task_number
    }
    return (a.display_order ?? 0) - (b.display_order ?? 0)
  })

  // Same fallback chain the view panel uses: the set when present, the retired singular
  // otherwise. Kept local rather than shared — the two call sites read different i18n
  // namespaces' worth of context and a third occurrence has not appeared.
  function rolesLabel(
    roles: readonly string[] | null,
    singular: string | null
  ): string {
    if (roles?.length) {
      return roles
        .map(role =>
          t(
            `detail.taskSheet.responsibleRoles.${role}` as "detail.taskSheet.responsibleRoles.front_office"
          )
        )
        .join(", ")
    }
    if (singular) {
      return t(
        `detail.taskSheet.responsibleRoles.${singular}` as "detail.taskSheet.responsibleRoles.front_office"
      )
    }
    return notApplicable
  }

  // PRD1042-2145 — override and deactivate both need a Global Default task to point at, so
  // opening "+ Add task" on override when none is selectable strands the author on a change type
  // that can never be saved: the parent picker collapses to an explanation and the form cannot
  // validate. Supplement is the one action a product-specific catalogue can always complete.
  // Resolved when the sheet opens rather than during render, so a background refetch can never
  // move the form's default under a half-filled sheet.
  function resolveDefaultLayerAction(): LayerAction {
    if (isGlobalDefaultLayer) return LayerActionSchema.enum.defined
    const claimedParentIds = new Set(
      tasks
        .filter(other => other.parent_task_id)
        .map(other => other.parent_task_id as string)
    )
    const hasSelectableParent = (globalDefaultTasks ?? []).some(
      candidate => !claimedParentIds.has(candidate.id)
    )
    return hasSelectableParent
      ? LayerActionSchema.enum.override
      : LayerActionSchema.enum.supplement
  }

  function mandatoryLabel(value: boolean | null): string {
    if (value === null) return notApplicable
    return value
      ? t("detail.taskDefinitions.yes")
      : t("detail.taskDefinitions.no")
  }

  return (
    <div className="flex flex-col gap-3" data-testid="task-definitions-tab">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("detail.taskDefinitions.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(
              canEdit
                ? "detail.taskDefinitions.captionEditable"
                : "detail.taskDefinitions.captionReadOnly"
            )}
          </p>
        </div>
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            data-testid="add-task-definition-button"
            onClick={() =>
              setSheetState({
                mode: "add",
                task: null,
                defaultLayerAction: resolveDefaultLayerAction(),
              })
            }
          >
            <Plus size={16} />
            {t("detail.taskDefinitions.addButton")}
          </Button>
        )}
      </div>

      {/* PRD1042-1892 item 2 — the catalogue's own stages. Placed here rather than on a tab of
          its own because tasks are grouped by stage: a task cannot be saved without one, so the
          two belong on the same surface. */}
      {/* No current version means no stages to hold and no task to save — the same guard the
          sheet applies below. */}
      {versionId && (
        <CatalogStagesPanel
          catalogId={catalogId}
          versionId={versionId}
          canEdit={canEdit}
        />
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {t("detail.taskDefinitions.columns.number")}
              </TableHead>
              <TableHead>{t("detail.taskDefinitions.columns.type")}</TableHead>
              <TableHead>{t("detail.taskDefinitions.columns.task")}</TableHead>
              <TableHead>
                {t("detail.taskDefinitions.columns.mandatory")}
              </TableHead>
              <TableHead>
                {t("detail.taskDefinitions.columns.weight")}
              </TableHead>
              <TableHead>{t("detail.taskDefinitions.columns.role")}</TableHead>
              <TableHead>{t("detail.taskDefinitions.columns.stage")}</TableHead>
              <TableHead>
                {t("detail.taskDefinitions.columns.docRef")}
              </TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedTasks.map(task => (
              <TableRow
                key={task.id}
                data-testid={`task-definition-row-${task.id}`}
                className="cursor-pointer"
                onClick={() => setSheetState({ mode: "view", task })}
                // The row is the only way into the task sheet, so it has to be reachable
                // without a mouse. Deliberately no role="button" — that would override the
                // implicit `row` role and break the table's semantics for screen readers.
                tabIndex={0}
                onKeyDown={event => {
                  if (event.key !== "Enter" && event.key !== " ") return
                  // Space scrolls the page by default.
                  event.preventDefault()
                  setSheetState({ mode: "view", task })
                }}
              >
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {task.task_number ?? notApplicable}
                </TableCell>
                <TableCell>
                  <TypeBadge layerAction={task.layer_action} />
                </TableCell>
                <TableCell>
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    {task.task_name ??
                      task.inherited?.task_name ??
                      notApplicable}
                    {/* Four eyes changes who may close the step, so it belongs beside the name
                        rather than in a column of its own — most rows do not have it. */}
                    {task.four_eyes && (
                      <span
                        className="inline-flex items-center gap-0.5 text-xs font-normal text-amber-700"
                        title={t("detail.taskDefinitions.fourEyesTitle")}
                        data-testid={`task-definition-four-eyes-${task.id}`}
                      >
                        <ShieldCheck size={14} />
                        {t("detail.taskDefinitions.fourEyesBadge")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.task_code ?? task.inherited?.task_code ?? "—"}
                    {task.inherited &&
                      `, ${t("detail.taskDefinitions.inheritedSuffix")}`}
                    {/* Only when it is NOT the default: `always` is what nearly every step
                        says, and repeating it down a 44-row catalogue hides the handful of
                        conditional steps that are the reason to look. */}
                    {task.applicability &&
                      task.applicability !==
                        TaskApplicabilitySchema.enum.always &&
                      `, ${t(
                        `detail.taskSheet.applicabilities.${task.applicability}` as "detail.taskSheet.applicabilities.always"
                      )}`}
                  </p>
                </TableCell>
                <TableCell>
                  <OverrideValue
                    own={mandatoryLabel(task.is_mandatory)}
                    inherited={
                      task.inherited &&
                      task.is_mandatory !== task.inherited.is_mandatory
                        ? mandatoryLabel(task.inherited.is_mandatory)
                        : null
                    }
                  />
                </TableCell>
                <TableCell>
                  <OverrideValue
                    own={task.weight ?? notApplicable}
                    inherited={
                      task.inherited && task.weight !== task.inherited.weight
                        ? (task.inherited.weight ?? notApplicable)
                        : null
                    }
                  />
                </TableCell>
                <TableCell>
                  {/* PRD1042-1892 item 13 — the role is a set. A row authored before 17 Aug
                      carries only the retired singular, so fall back to it rather than
                      showing nothing for historical tasks. An override shows the inherited set
                      struck through beneath its own, like every other overridden value here. */}
                  <OverrideValue
                    own={rolesLabel(
                      task.responsible_roles,
                      task.responsible_role
                    )}
                    inherited={
                      task.inherited &&
                      rolesLabel(
                        task.inherited.responsible_roles,
                        task.inherited.responsible_role
                      ) !==
                        rolesLabel(
                          task.responsible_roles,
                          task.responsible_role
                        )
                        ? rolesLabel(
                            task.inherited.responsible_roles,
                            task.inherited.responsible_role
                          )
                        : null
                    }
                  />
                </TableCell>
                <TableCell>
                  {task.stage_categorization
                    ? t(`detail.taskSheet.stages.${task.stage_categorization}`)
                    : notApplicable}
                </TableCell>
                {/* US 15.7. The design renders the code as a link, but Epic 16 has no screen to
                    navigate to, so it is plain text until one exists — a blue link that goes
                    nowhere promises navigation this app cannot perform. */}
                <TableCell>
                  {task.doc_requirement_ref ? (
                    <span className="flex items-center gap-1">
                      <File size={16} className="text-muted-foreground" />
                      {documentRequirementCode(task.doc_requirement_ref)}
                    </span>
                  ) : (
                    notApplicable
                  )}
                </TableCell>
                <TableCell>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {orderedTasks.length === 0 && (
          <TableEmptyState
            title={t("detail.taskDefinitions.emptyState.title")}
            description={t(
              canEdit
                ? "detail.taskDefinitions.emptyState.descriptionEditable"
                : "detail.taskDefinitions.emptyState.descriptionReadOnly"
            )}
          />
        )}
      </div>

      {sheetState && versionId && (
        <TaskDefinitionSheet
          // Remount per mode+task so the sheet picks up a fresh default value set. It uses
          // RHF `defaultValues`, which are only read on mount — deliberately, so a re-render
          // cannot wipe half-entered input.
          key={`${sheetState.mode}-${sheetState.task?.id ?? "new"}`}
          mode={sheetState.mode}
          task={sheetState.task}
          catalogId={catalogId}
          versionId={versionId}
          catalogLayer={catalogLayer}
          entityType={entityType}
          tenantId={tenantId}
          existingTasks={tasks}
          canEdit={canEdit}
          defaultLayerAction={
            sheetState.mode === "add"
              ? sheetState.defaultLayerAction
              : undefined
          }
          onOpenChange={open => !open && setSheetState(null)}
          onRequestEdit={() =>
            setSheetState(prev =>
              prev && prev.task ? { mode: "edit", task: prev.task } : prev
            )
          }
        />
      )}
    </div>
  )
}

export { TaskDefinitionsTab }
