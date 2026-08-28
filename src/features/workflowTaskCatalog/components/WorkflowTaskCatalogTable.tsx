import { useTranslation } from "react-i18next"
import { TableEmptyState } from "@/components/ui/empty"
import { formatDate, formatDateTime } from "@/lib/formatters"
import { WorkflowTaskCatalogStateBadge } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogStateBadge"
import { WorkflowTaskCatalogRowActionsMenu } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogRowActionsMenu"
import type { CatalogListItem } from "@/features/workflowTaskCatalog/api/schema"

// NOTE: raw <div> grid instead of shadcn Table — matches the pre-existing div-grid
// pattern used by other list tables in this codebase (ProductTemplateTable, PartnerTable,
// TenantTable, UserTable); a full conversion to <Table>/<TableRow>/<TableCell> is out of
// scope here.
// Name is the only flexible column, so it absorbs whatever the fixed ones leave — widening a
// fixed column narrows the name rather than overflowing the row. Layer fits "Catalog layer" on
// one line; Created fits "30 Jul 2026, 15:40 CEST" on one line, the zone suffix added for Q-047.
const COL_NAME = "flex-1 min-w-[160px]"
const COL_LAYER = "w-[120px] shrink-0"
const COL_ENTITY = "w-[140px] shrink-0"
const COL_PRODUCT_TEMPLATE = "w-[150px] shrink-0"
const COL_VALID_FROM = "w-[110px] shrink-0"
const COL_VALID_UNTIL = "w-[110px] shrink-0"
const COL_CREATED = "w-[190px] shrink-0"
const COL_STATE = "w-[110px] shrink-0"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

// The column set US 15.22 asks for, plus Valid from / Valid until. Version, Published at and
// Object ref count are absent by that story's own November scope note (no version-state
// columns) and have no wire source either. Applicable Product Template IS required, but the
// list response only carries entity_id — the name is resolved client-side, see templateNames.
const HEADER_COLUMNS = [
  { width: COL_NAME, labelKey: "list.table.columns.catalogName" },
  { width: COL_LAYER, labelKey: "list.table.columns.catalogLayer" },
  { width: COL_ENTITY, labelKey: "list.table.columns.caseType" },
  {
    width: COL_PRODUCT_TEMPLATE,
    labelKey: "list.table.columns.productTemplate",
  },
  { width: COL_VALID_FROM, labelKey: "list.table.columns.validFrom" },
  { width: COL_VALID_UNTIL, labelKey: "list.table.columns.validUntil" },
  { width: COL_CREATED, labelKey: "list.table.columns.createdAt" },
  { width: COL_STATE, labelKey: "list.table.columns.catalogState" },
] as const

type Props = {
  rows: CatalogListItem[]
  isLoading: boolean
  hasActiveFilters: boolean
  // template UUID → display name. Sourced from /product-templates/selectable, which only lists
  // templates with a published version valid today, so a catalog bound to a template that has
  // since been superseded resolves to nothing and falls back to the id.
  templateNames: Map<string, string>
  onOpenDetail: (catalogId: string) => void
}

function WorkflowTaskCatalogTable({
  rows,
  isLoading,
  hasActiveFilters,
  templateNames,
  onOpenDetail,
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

      {isLoading && (
        <div data-testid="workflow-task-catalog-table-loading">
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
              <div className="shrink-0 w-10" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
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

      {/* Data rows */}
      {!isLoading &&
        rows.map(row => (
          <div
            key={row.id}
            data-testid={`catalog-row-${row.id}`}
            className={`flex border-b border-border last:border-b-0 ${ROW_H} items-center hover:bg-muted/40 transition-colors`}
          >
            <div className={`${COL_NAME} p-2`}>
              <p className="text-sm font-medium truncate text-foreground leading-tight">
                {row.catalog_name}
              </p>
            </div>
            <div className={`${COL_LAYER} p-2`}>
              <span className="text-sm text-foreground">
                {t(
                  `list.table.catalogLayerShort.${row.catalog_layer}` as "list.table.catalogLayerShort.global_default"
                )}
              </span>
            </div>
            <div className={`${COL_ENTITY} p-2`}>
              <span className="text-sm text-foreground">
                {row.case_type
                  ? t(`caseTypes.${row.case_type}` as "caseTypes.lessee_change")
                  : t("list.table.notApplicable")}
              </span>
            </div>
            <div className={`${COL_PRODUCT_TEMPLATE} p-2`}>
              <span className="text-sm text-foreground truncate block">
                {row.entity_id
                  ? (templateNames.get(row.entity_id) ?? row.entity_id)
                  : t("list.table.notApplicable")}
              </span>
            </div>
            <div className={`${COL_VALID_FROM} p-2`}>
              <span className="text-sm text-foreground">
                {formatDate(row.valid_from)}
              </span>
            </div>
            <div className={`${COL_VALID_UNTIL} p-2`}>
              <span
                className={
                  row.valid_until
                    ? "text-sm text-foreground"
                    : "text-sm text-muted-foreground"
                }
              >
                {row.valid_until
                  ? formatDate(row.valid_until)
                  : t("list.table.openEnded")}
              </span>
            </div>
            <div className={`${COL_CREATED} p-2`}>
              <span className="text-sm text-foreground">
                {formatDateTime(row.created_at)}
              </span>
            </div>
            <div className={`${COL_STATE} p-2`}>
              <WorkflowTaskCatalogStateBadge state={row.catalog_state} />
            </div>
            <div className="shrink-0 w-10 p-2 flex items-center justify-center">
              <WorkflowTaskCatalogRowActionsMenu
                catalogId={row.id}
                onOpenDetail={() => onOpenDetail(row.id)}
              />
            </div>
          </div>
        ))}
    </div>
  )
}

export { WorkflowTaskCatalogTable }
