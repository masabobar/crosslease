import { useTranslation } from "react-i18next"
import { TableEmptyState } from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { RequirementRowActionsMenu } from "@/features/documentRequirements/components/RequirementRowActionsMenu"
import type { RequirementResponse } from "@/features/documentRequirements/api/schema"

// NOTE: raw <div> grid instead of shadcn Table — matches the pre-existing div-grid pattern used
// by other list tables in this codebase (see ProductTemplateTable.tsx, Unit A).
const COL_CODE = "w-[180px] shrink-0"
const COL_NAME = "flex-1 min-w-[160px]"
const COL_CLASSIFICATION = "w-[130px] shrink-0"
const COL_STATUS = "w-[100px] shrink-0"
const ROW_H = "h-[52px]"

const HEADER_COLUMNS = [
  { width: COL_CODE, labelKey: "requirement.table.columns.requirementCode" },
  { width: COL_NAME, labelKey: "requirement.table.columns.documentTypeName" },
  {
    width: COL_CLASSIFICATION,
    labelKey: "requirement.table.columns.classification",
  },
  { width: COL_STATUS, labelKey: "requirement.table.columns.status" },
] as const

type Props = {
  requirements: RequirementResponse[]
  hasActiveFilters: boolean
  canManage: boolean
  onRowClick: (requirement: RequirementResponse) => void
  onEdit: (requirement: RequirementResponse) => void
  onDeactivate: (requirement: RequirementResponse) => void
}

function RequirementTable({
  requirements,
  hasActiveFilters,
  canManage,
  onRowClick,
  onEdit,
  onDeactivate,
}: Props) {
  const { t } = useTranslation("documentRequirements")

  return (
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="requirement-table"
    >
      <div className="flex border-b border-border h-10 items-center">
        {HEADER_COLUMNS.map(col => (
          <div
            key={col.labelKey}
            className={`${col.width} text-sm font-medium text-foreground px-2`}
          >
            {t(col.labelKey)}
          </div>
        ))}
        <div className="shrink-0 w-10" />
      </div>

      {requirements.length === 0 &&
        (hasActiveFilters ? (
          <TableEmptyState
            title={t("requirement.emptyFiltered.title")}
            description={t("requirement.emptyFiltered.description")}
          />
        ) : (
          <TableEmptyState
            title={t("requirement.emptyState.title")}
            description={t("requirement.emptyState.description")}
          />
        ))}

      {requirements.map(requirement => (
        <div
          key={requirement.id}
          data-testid={`requirement-row-${requirement.id}`}
          className={`flex border-b border-border last:border-b-0 ${ROW_H} items-center hover:bg-muted/40 transition-colors cursor-pointer`}
          onClick={() => onRowClick(requirement)}
        >
          <div className={`${COL_CODE} p-2`}>
            <p className="text-sm font-medium truncate text-foreground leading-tight">
              {requirement.requirement_code}
            </p>
          </div>
          <div className={`${COL_NAME} p-2`}>
            <p className="text-sm text-foreground truncate">
              {requirement.document_type_name}
            </p>
          </div>
          <div className={`${COL_CLASSIFICATION} p-2`}>
            <span className="text-sm text-foreground">
              {t(
                `requirement.classifications.${requirement.classification}` as "requirement.classifications.mandatory"
              )}
            </span>
          </div>
          <div className={`${COL_STATUS} p-2`}>
            <Badge variant={requirement.is_active ? "secondary" : "outline"}>
              {requirement.is_active
                ? t("requirement.active")
                : t("requirement.inactive")}
            </Badge>
          </div>
          <div
            className="shrink-0 w-10 p-2 flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <RequirementRowActionsMenu
              requirementId={requirement.id}
              isActive={requirement.is_active}
              canManage={canManage}
              onEdit={() => onEdit(requirement)}
              onDeactivate={() => onDeactivate(requirement)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export { RequirementTable }
