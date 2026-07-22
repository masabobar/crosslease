import { useTranslation } from "react-i18next"
import { TableEmptyState } from "@/components/ui/empty"
import { formatDate } from "@/lib/formatters"
import { WorkflowTaskCatalogStateBadge } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogStateBadge"
import { WorkflowTaskCatalogRowActionsMenu } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogRowActionsMenu"
import type {
  CatalogRowAction,
  WorkflowTaskCatalogRow,
} from "@/features/workflowTaskCatalog/constants"

// NOTE: raw <div> grid instead of shadcn Table — matches the pre-existing div-grid
// pattern used by other list tables in this codebase (ProductTemplateTable, PartnerTable,
// TenantTable, UserTable); a full conversion to <Table>/<TableRow>/<TableCell> is out of
// scope here.
const COL_NAME = "flex-1 min-w-[160px]"
const COL_LAYER = "w-[90px] shrink-0"
const COL_ENTITY = "w-[140px] shrink-0"
const COL_PRODUCT_TEMPLATE = "w-[150px] shrink-0"
const COL_VERSION = "w-[70px] shrink-0"
const COL_PUBLISHED = "w-[110px] shrink-0"
const COL_STATE = "w-[110px] shrink-0"
const COL_REF_COUNT = "w-[110px] shrink-0"
const ROW_H = "h-[52px]"

const HEADER_COLUMNS = [
  { width: COL_NAME, labelKey: "list.table.columns.catalogName" },
  { width: COL_LAYER, labelKey: "list.table.columns.catalogLayer" },
  { width: COL_ENTITY, labelKey: "list.table.columns.entityType" },
  {
    width: COL_PRODUCT_TEMPLATE,
    labelKey: "list.table.columns.productTemplate",
  },
  { width: COL_VERSION, labelKey: "list.table.columns.version" },
  { width: COL_PUBLISHED, labelKey: "list.table.columns.publishedAt" },
  { width: COL_STATE, labelKey: "list.table.columns.catalogState" },
  { width: COL_REF_COUNT, labelKey: "list.table.columns.objectRefCount" },
] as const

type Props = {
  rows: WorkflowTaskCatalogRow[]
  hasActiveFilters: boolean
  canManage: boolean
  onRowAction: (action: CatalogRowAction, row: WorkflowTaskCatalogRow) => void
}

function WorkflowTaskCatalogTable({
  rows,
  hasActiveFilters,
  canManage,
  onRowAction,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  return (
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="workflow-task-catalog-table"
    >
      {/* Header */}
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

      {/* Empty state */}
      {rows.length === 0 &&
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

      {/* Data rows */}
      {rows.map(row => (
        <div
          key={row.id}
          data-testid={`catalog-row-${row.id}`}
          className={`flex border-b border-border last:border-b-0 ${ROW_H} items-center hover:bg-muted/40 transition-colors`}
        >
          <div className={`${COL_NAME} p-2`}>
            <p className="text-sm font-medium truncate text-foreground leading-tight">
              {row.catalogName}
            </p>
          </div>
          <div className={`${COL_LAYER} p-2`}>
            <span className="text-sm text-foreground">
              {t(
                `list.table.catalogLayerShort.${row.catalogLayer}` as "list.table.catalogLayerShort.global_default"
              )}
            </span>
          </div>
          <div className={`${COL_ENTITY} p-2`}>
            <span className="text-sm text-foreground">
              {t(`entityTypes.${row.entityType}` as "entityTypes.financing")}
            </span>
          </div>
          <div className={`${COL_PRODUCT_TEMPLATE} p-2`}>
            <span className="text-sm text-foreground truncate">
              {row.productTemplateName ?? "—"}
            </span>
          </div>
          <div className={`${COL_VERSION} p-2`}>
            <span className="text-sm text-foreground">{row.version}</span>
          </div>
          <div className={`${COL_PUBLISHED} p-2`}>
            <span
              className={
                row.publishedAt
                  ? "text-sm text-foreground"
                  : "text-sm text-muted-foreground"
              }
            >
              {row.publishedAt
                ? formatDate(row.publishedAt)
                : t("list.table.openEnded")}
            </span>
          </div>
          <div className={`${COL_STATE} p-2`}>
            <WorkflowTaskCatalogStateBadge state={row.catalogState} />
          </div>
          <div className={`${COL_REF_COUNT} p-2`}>
            <span className="text-sm text-foreground">
              {row.objectRefCount}
            </span>
          </div>
          <div className="shrink-0 w-10 p-2 flex items-center justify-center">
            <WorkflowTaskCatalogRowActionsMenu
              row={row}
              canManage={canManage}
              onAction={onRowAction}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export { WorkflowTaskCatalogTable }
