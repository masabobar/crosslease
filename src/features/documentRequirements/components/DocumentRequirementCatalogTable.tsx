import { useTranslation } from "react-i18next"
import { TableEmptyState } from "@/components/ui/empty"
import { formatDate, formatDateTime } from "@/lib/formatters"
import type { DocumentRequirementCatalogListItem } from "@/features/documentRequirements/api/schema"

// NOTE: raw <div> grid instead of shadcn Table — matches the pre-existing div-grid pattern used
// by other list tables in this codebase (ProductTemplateTable, PartnerTable, WorkflowTaskCatalogTable).
// Name is the only flexible column.
const COL_NAME = "flex-1 min-w-[160px]"
const COL_TYPE = "w-[130px] shrink-0"
const COL_PROCESS_CONTEXTS = "w-[220px] shrink-0"
const COL_PRODUCT_TEMPLATE = "w-[160px] shrink-0"
const COL_VALID_FROM = "w-[110px] shrink-0"
const COL_VALID_TO = "w-[110px] shrink-0"
const COL_CREATED = "w-[190px] shrink-0"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

// Operational State and Created By are absent by design — neither field exists on the wire
// (see open-questions.md). Applicable Product Template resolves entity_id via the same
// selectable-templates join the Workflow Task Catalog uses (Q-042's sanctioned pattern).
const HEADER_COLUMNS = [
  { width: COL_NAME, labelKey: "list.table.columns.catalogName" },
  { width: COL_TYPE, labelKey: "list.table.columns.catalogType" },
  {
    width: COL_PROCESS_CONTEXTS,
    labelKey: "list.table.columns.processContexts",
  },
  {
    width: COL_PRODUCT_TEMPLATE,
    labelKey: "list.table.columns.productTemplate",
  },
  { width: COL_VALID_FROM, labelKey: "list.table.columns.validFrom" },
  { width: COL_VALID_TO, labelKey: "list.table.columns.validTo" },
  { width: COL_CREATED, labelKey: "list.table.columns.createdAt" },
] as const

type Props = {
  rows: DocumentRequirementCatalogListItem[]
  isLoading: boolean
  hasActiveFilters: boolean
  // Product Template UUID → display name, sourced from /product-templates/selectable. Only
  // covers templates with a published version valid today; a superseded template falls back to
  // its id, same convention as the Workflow Task Catalog's table.
  templateNames: Map<string, string>
  onRowClick: (catalogId: string) => void
}

function DocumentRequirementCatalogTable({
  rows,
  isLoading,
  hasActiveFilters,
  templateNames,
  onRowClick,
}: Props) {
  const { t } = useTranslation("documentRequirements")

  return (
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="document-requirement-catalog-table"
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
        <div data-testid="document-requirement-catalog-table-loading">
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
            data-testid={`document-requirement-catalog-row-${row.id}`}
            className={`flex border-b border-border last:border-b-0 ${ROW_H} items-center hover:bg-muted/40 transition-colors cursor-pointer`}
            onClick={() => onRowClick(row.id)}
          >
            <div className={`${COL_NAME} p-2`}>
              <p className="text-sm font-medium truncate text-foreground leading-tight">
                {row.catalog_name}
              </p>
            </div>
            <div className={`${COL_TYPE} p-2`}>
              <span className="text-sm text-foreground">
                {t(
                  `catalogTypes.${row.catalog_type}` as "catalogTypes.global_default"
                )}
              </span>
            </div>
            <div className={`${COL_PROCESS_CONTEXTS} p-2`}>
              <span className="text-sm text-foreground truncate block">
                {row.applicable_process_contexts
                  .map(value =>
                    t(
                      `processContexts.${value}` as "processContexts.financing",
                      {
                        defaultValue: value,
                      }
                    )
                  )
                  .join(", ")}
              </span>
            </div>
            <div className={`${COL_PRODUCT_TEMPLATE} p-2`}>
              <span className="text-sm text-foreground truncate block">
                {row.product_template_id
                  ? (templateNames.get(row.product_template_id) ??
                    row.product_template_id)
                  : t("list.table.notApplicable")}
              </span>
            </div>
            <div className={`${COL_VALID_FROM} p-2`}>
              <span className="text-sm text-foreground">
                {row.valid_from
                  ? formatDate(row.valid_from)
                  : t("list.table.notApplicable")}
              </span>
            </div>
            <div className={`${COL_VALID_TO} p-2`}>
              <span
                className={
                  row.valid_to
                    ? "text-sm text-foreground"
                    : "text-sm text-muted-foreground"
                }
              >
                {row.valid_to
                  ? formatDate(row.valid_to)
                  : t("list.table.openEnded")}
              </span>
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

export { DocumentRequirementCatalogTable }
