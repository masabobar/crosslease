import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TaskDefinitionSheet } from "@/features/workflowTaskCatalog/components/TaskDefinitionSheet"
import { PLACEHOLDER_TASK_DEFINITIONS } from "@/features/workflowTaskCatalog/constants"
import type {
  PlaceholderTaskDefinition,
  TaskDefinitionType,
} from "@/features/workflowTaskCatalog/constants"
import type { CatalogLayer } from "@/features/workflowTaskCatalog/api/schema"

const TYPE_BADGE_CLASSES: Record<TaskDefinitionType, string> = {
  global: "bg-sky-600/10 text-sky-600",
  override: "bg-lime-600/10 text-lime-700",
  deactivate: "bg-muted text-muted-foreground",
  supplement: "bg-purple-600/10 text-purple-600",
}

function TypeBadge({ type }: { type: TaskDefinitionType }) {
  const { t } = useTranslation("workflowTaskCatalog")
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE_CLASSES[type]}`}
    >
      {t(`detail.taskDefinitions.types.${type}`)}
    </span>
  )
}

type SheetState =
  | { mode: "view" | "edit"; task: PlaceholderTaskDefinition }
  | { mode: "add"; task: null }
  | null

type Props = {
  catalogLayer: CatalogLayer
  canEdit: boolean
}

function TaskDefinitionsTab({ catalogLayer, canEdit }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const [sheetState, setSheetState] = useState<SheetState>(null)

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
              <TableHead>{t("detail.taskDefinitions.columns.role")}</TableHead>
              <TableHead>{t("detail.taskDefinitions.columns.stage")}</TableHead>
              <TableHead>
                {t("detail.taskDefinitions.columns.docRef")}
              </TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLACEHOLDER_TASK_DEFINITIONS.map(task => (
              <TableRow
                key={task.id}
                data-testid={`task-definition-row-${task.id}`}
                className="cursor-pointer"
                onClick={() => setSheetState({ mode: "view", task })}
              >
                <TableCell>
                  <TypeBadge type={task.type} />
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{task.taskName}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.taskCode}
                    {task.inherited &&
                      `, ${t("detail.taskDefinitions.inheritedSuffix")}`}
                  </p>
                </TableCell>
                <TableCell>
                  {task.mandatory === null
                    ? t("detail.taskDefinitions.notApplicable")
                    : task.mandatory
                      ? t("detail.taskDefinitions.yes")
                      : t("detail.taskDefinitions.no")}
                </TableCell>
                <TableCell>
                  {task.responsibleRole
                    ? t(
                        `detail.taskSheet.responsibleRoles.${task.responsibleRole}`
                      )
                    : t("detail.taskDefinitions.notApplicable")}
                </TableCell>
                <TableCell>
                  {task.stage
                    ? t(`detail.taskSheet.stages.${task.stage}`)
                    : t("detail.taskDefinitions.notApplicable")}
                </TableCell>
                <TableCell>
                  {task.documentRequirementRef ? (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <FileText size={14} />
                      {task.documentRequirementRef}
                    </span>
                  ) : (
                    t("detail.taskDefinitions.notApplicable")
                  )}
                </TableCell>
                <TableCell>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sheetState && (
        <TaskDefinitionSheet
          mode={sheetState.mode}
          task={sheetState.task}
          catalogLayer={catalogLayer}
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
