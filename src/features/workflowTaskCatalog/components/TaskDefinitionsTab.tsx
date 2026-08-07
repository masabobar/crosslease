import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, File, Plus } from "lucide-react"
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
import { useTenantDocumentRequirements } from "@/features/documentRequirements/hooks/useTenantDocumentRequirements"
import { LayerActionSchema } from "@/features/workflowTaskCatalog/api/schema"
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
  | { mode: "add"; task: null }
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

  // A task carries only the requirement's UUID, so the code has to be resolved. An id outside the
  // fetched page falls back to the raw UUID rather than rendering blank, so it stays diagnosable.
  const requirementCodeById = new Map(
    (documentRequirements ?? []).map(r => [r.id, r.requirement_code])
  )
  function documentRequirementCode(ref: string): string {
    return requirementCodeById.get(ref) ?? ref
  }

  const orderedTasks = [...tasks].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  )

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
            onClick={() => setSheetState({ mode: "add", task: null })}
          >
            <Plus size={16} />
            {t("detail.taskDefinitions.addButton")}
          </Button>
        )}
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell>
                  <TypeBadge layerAction={task.layer_action} />
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">
                    {task.task_name ??
                      task.inherited?.task_name ??
                      notApplicable}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.task_code ?? task.inherited?.task_code ?? "—"}
                    {task.inherited &&
                      `, ${t("detail.taskDefinitions.inheritedSuffix")}`}
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
                  {task.responsible_role
                    ? t(
                        `detail.taskSheet.responsibleRoles.${task.responsible_role}`
                      )
                    : notApplicable}
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
