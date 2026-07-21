import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SelectField } from "@/components/ui/select"
import {
  PLACEHOLDER_EFFECTIVE_TASKS,
  PLACEHOLDER_PRODUCT_TEMPLATE_OPTIONS,
  TASK_DEFINITION_TYPE,
} from "@/features/workflowTaskCatalog/constants"
import type {
  EntityType,
  TaskDefinitionType,
} from "@/features/workflowTaskCatalog/constants"

const SOURCE_BADGE_CLASSES: Record<TaskDefinitionType, string> = {
  global: "bg-sky-600/10 text-sky-600",
  override: "bg-lime-600/10 text-lime-700",
  deactivate: "bg-muted text-muted-foreground",
  supplement: "bg-purple-600/10 text-purple-600",
}

// Effective task rows only ever surface as Global / Override / Supplement (a
// Deactivated task is excluded from the effective set entirely) — narrower than
// TaskDefinitionType so the i18n legend keys below don't need a "deactivate" entry.
const LEGEND_ITEMS: Extract<
  TaskDefinitionType,
  "global" | "override" | "supplement"
>[] = [
  TASK_DEFINITION_TYPE.GLOBAL,
  TASK_DEFINITION_TYPE.OVERRIDE,
  TASK_DEFINITION_TYPE.SUPPLEMENT,
]

type Props = {
  activeVersion: string
  productTemplateName: string | null
  entityType: EntityType
  onOpenChange: (open: boolean) => void
}

// Static shell only — the version / product template / entity type selects are
// presentational; PLACEHOLDER_EFFECTIVE_TASKS does not vary by selection since there
// is no resolution engine yet for Epic 15 (see CLAUDE.md).
function EffectiveTaskSetPreviewSheet({
  activeVersion,
  productTemplateName,
  entityType,
  onOpenChange,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent
        data-testid="effective-task-set-preview-sheet"
        className="sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>{t("detail.effectiveTaskPreview.title")}</SheetTitle>
          <SheetDescription>
            {t("detail.effectiveTaskPreview.subtitle", {
              active: PLACEHOLDER_EFFECTIVE_TASKS.length,
              suppressed: 1,
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t("detail.effectiveTaskPreview.filters.catalogVersion")}
              </p>
              <SelectField
                data-testid="effective-task-preview-version-select"
                value={activeVersion}
                onValueChange={() => undefined}
                options={[{ value: activeVersion, label: activeVersion }]}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t("detail.effectiveTaskPreview.filters.productTemplate")}
              </p>
              <SelectField
                data-testid="effective-task-preview-product-template-select"
                value={productTemplateName ?? ""}
                onValueChange={() => undefined}
                options={
                  productTemplateName
                    ? [
                        {
                          value: productTemplateName,
                          label: productTemplateName,
                        },
                      ]
                    : [...PLACEHOLDER_PRODUCT_TEMPLATE_OPTIONS]
                }
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t("detail.effectiveTaskPreview.filters.entityType")}
              </p>
              <SelectField
                data-testid="effective-task-preview-entity-type-select"
                value={entityType}
                onValueChange={() => undefined}
                options={[
                  { value: entityType, label: t(`entityTypes.${entityType}`) },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {LEGEND_ITEMS.map(type => (
              <span key={type} className="inline-flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${SOURCE_BADGE_CLASSES[type]}`}
                >
                  {t(`detail.taskDefinitions.types.${type}`)}
                </span>
                {t(`detail.effectiveTaskPreview.legend.${type}`)}
              </span>
            ))}
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("detail.effectiveTaskPreview.columns.code")}
                  </TableHead>
                  <TableHead>
                    {t("detail.effectiveTaskPreview.columns.task")}
                  </TableHead>
                  <TableHead>
                    {t("detail.effectiveTaskPreview.columns.source")}
                  </TableHead>
                  <TableHead>
                    {t("detail.effectiveTaskPreview.columns.mandatory")}
                  </TableHead>
                  <TableHead>
                    {t("detail.effectiveTaskPreview.columns.weight")}
                  </TableHead>
                  <TableHead>
                    {t("detail.effectiveTaskPreview.columns.role")}
                  </TableHead>
                  <TableHead>
                    {t("detail.effectiveTaskPreview.columns.stage")}
                  </TableHead>
                  <TableHead>
                    {t("detail.effectiveTaskPreview.columns.docRef")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PLACEHOLDER_EFFECTIVE_TASKS.map(task => (
                  <TableRow
                    key={task.code}
                    data-testid={`effective-task-row-${task.code}`}
                  >
                    <TableCell className="font-medium text-foreground">
                      {task.code}
                    </TableCell>
                    <TableCell>{task.taskName}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${SOURCE_BADGE_CLASSES[task.source]}`}
                      >
                        {t(`detail.taskDefinitions.types.${task.source}`)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {task.mandatory
                        ? t("detail.taskDefinitions.yes")
                        : t("detail.taskDefinitions.notApplicable")}
                    </TableCell>
                    <TableCell>{task.weight}</TableCell>
                    <TableCell>
                      {t(
                        `detail.taskSheet.responsibleRoles.${task.responsibleRole}`
                      )}
                    </TableCell>
                    <TableCell>{task.stage}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("detail.effectiveTaskPreview.suppressedNote")}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { EffectiveTaskSetPreviewSheet }
