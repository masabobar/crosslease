import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { TableEmptyState } from "@/components/ui/empty"
import { formatDateTime } from "@/lib/formatters"
import { caseDisplayStatusBadgeVariant } from "@/features/cases/types"
import type { CaseListItem } from "@/features/cases/api/schema"

// Raw <div> grid rather than the shadcn Table primitive — matches the pre-existing div-grid list
// pattern (DocumentRequirementCatalogTable, ProductTemplateTable, WorkflowTaskCatalogTable). Case
// reference is the only flexible column.
const COL_REFERENCE = "flex-1 min-w-[160px]"
const COL_TYPE = "w-[200px] shrink-0"
const COL_STATUS = "w-[160px] shrink-0"
const COL_CREATED = "w-[190px] shrink-0"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

const HEADER_COLUMNS = [
  { width: COL_REFERENCE, labelKey: "list.table.columns.caseReference" },
  { width: COL_TYPE, labelKey: "list.table.columns.caseType" },
  { width: COL_STATUS, labelKey: "list.table.columns.status" },
  { width: COL_CREATED, labelKey: "list.table.columns.createdAt" },
] as const

type Props = {
  rows: CaseListItem[]
  isLoading: boolean
  hasActiveFilters: boolean
  onRowClick: (caseId: string) => void
}

export function CaseTable({
  rows,
  isLoading,
  hasActiveFilters,
  onRowClick,
}: Props) {
  const { t } = useTranslation("cases")

  return (
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="case-table"
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
      </div>

      {isLoading && (
        <div data-testid="case-table-loading">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div
              key={i}
              className={`flex border-b border-border ${ROW_H} items-center`}
            >
              {HEADER_COLUMNS.map(col => (
                <div key={col.labelKey} className={`${col.width} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!isLoading &&
        rows.length === 0 &&
        (hasActiveFilters ? (
          <TableEmptyState
            title={t("list.emptyFiltered.title")}
            description={t("list.emptyFiltered.description")}
          />
        ) : (
          <TableEmptyState
            title={t("list.emptyState.title")}
            description={t("list.emptyState.description")}
          />
        ))}

      {!isLoading &&
        rows.map(row => (
          <div
            key={row.id}
            data-testid={`case-row-${row.id}`}
            className={`flex border-b border-border last:border-b-0 ${ROW_H} items-center hover:bg-muted/40 transition-colors cursor-pointer`}
            onClick={() => onRowClick(row.id)}
          >
            <div className={`${COL_REFERENCE} p-2`}>
              <p className="text-sm font-medium truncate text-foreground leading-tight">
                {row.case_reference}
              </p>
            </div>
            <div className={`${COL_TYPE} p-2`}>
              <span className="text-sm text-foreground truncate block">
                {t(
                  `caseTypes.${row.case_type}` as "caseTypes.refinancing_request",
                  { defaultValue: row.case_type }
                )}
              </span>
            </div>
            <div className={`${COL_STATUS} p-2`}>
              <Badge
                variant={caseDisplayStatusBadgeVariant(row.display_status)}
              >
                {t(
                  `displayStatuses.${row.display_status}` as "displayStatuses.open",
                  { defaultValue: row.display_status }
                )}
              </Badge>
            </div>
            <div className={`${COL_CREATED} p-2`}>
              <span className="text-sm text-foreground">
                {formatDateTime(row.created_at)}
              </span>
            </div>
          </div>
        ))}
    </div>
  )
}
