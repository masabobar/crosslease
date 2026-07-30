import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { TableEmptyState } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { TemplateVersionStatusBadge } from "@/features/productTemplates/components/TemplateVersionStatusBadge"
import type {
  TemplateListItem,
  TemplateCurrentVersionSummary,
} from "@/features/productTemplates/api/schema"

const COL_PRODUCT = "flex-1 min-w-[180px]"
const COL_FINANCING = "w-[170px] shrink-0"
const COL_CALCULATION = "w-[120px] shrink-0"
const COL_LTV_TERM = "w-[150px] shrink-0"
const COL_STATUS = "w-[110px] shrink-0"
const COL_VERSION = "w-[70px] shrink-0"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

const HEADER_COLUMNS = [
  { width: COL_PRODUCT, labelKey: "list.table.columns.product" },
  { width: COL_FINANCING, labelKey: "list.table.columns.financingType" },
  { width: COL_CALCULATION, labelKey: "list.table.columns.calculation" },
  { width: COL_LTV_TERM, labelKey: "list.table.columns.ltvTerm" },
  { width: COL_STATUS, labelKey: "list.table.columns.status" },
  { width: COL_VERSION, labelKey: "list.table.columns.version" },
] as const

// Combines the two design facts in the "LTV & term" column ("Max 85% / 24–84m"),
// showing only the parts the current version actually provides.
function LtvTermCell({
  version,
}: {
  version: TemplateCurrentVersionSummary | null
}) {
  const { t } = useTranslation("productTemplates")
  if (!version) return <>—</>
  const parts: string[] = []
  if (version.max_ltv_ratio !== null && version.max_ltv_ratio !== undefined)
    parts.push(t("list.ltvValue", { value: version.max_ltv_ratio }))
  if (
    version.min_term_months !== null &&
    version.min_term_months !== undefined &&
    version.max_term_months !== null &&
    version.max_term_months !== undefined
  )
    parts.push(
      t("list.termValue", {
        min: version.min_term_months,
        max: version.max_term_months,
      })
    )
  return <>{parts.length > 0 ? parts.join(" / ") : "—"}</>
}

type ProductTemplateTableProps = {
  templates: TemplateListItem[]
  isLoading: boolean
  hasActiveFilters: boolean
  onRowClick?: (template: TemplateListItem) => void
  onCreateTemplate?: () => void
}

function ProductTemplateTable({
  templates,
  isLoading,
  hasActiveFilters,
  onRowClick,
  onCreateTemplate,
}: ProductTemplateTableProps) {
  const { t } = useTranslation("productTemplates")

  return (
    // NOTE: raw <div> grid instead of shadcn Table — matches the pre-existing div-grid
    // pattern used by other list tables in this codebase (e.g. TenantTable, PartnerTable,
    // AuditTable); a full conversion to <Table>/<TableRow>/<TableCell> is out of scope here.
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="product-template-table"
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
        <div className="shrink-0 w-8" />
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div data-testid="product-template-table-loading">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div
              key={i}
              className={`flex border-b border-border ${ROW_H} items-center`}
            >
              <div className={`${COL_PRODUCT} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-32" />
              </div>
              <div className={`${COL_FINANCING} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-28" />
              </div>
              <div className={`${COL_CALCULATION} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-16" />
              </div>
              <div className={`${COL_LTV_TERM} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-24" />
              </div>
              <div className={`${COL_STATUS} p-2`}>
                <div className="bg-muted rounded-full h-5 animate-pulse w-16" />
              </div>
              <div className={`${COL_VERSION} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-8" />
              </div>
              <div className="shrink-0 w-8" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading &&
        templates.length === 0 &&
        (hasActiveFilters ? (
          <TableEmptyState
            title={t("list.emptyFiltered.title")}
            description={t("list.emptyFiltered.description")}
          />
        ) : (
          <TableEmptyState
            title={t("list.emptyState.title")}
            description={t("list.emptyState.description")}
            action={
              onCreateTemplate && (
                <Button
                  data-testid="create-template-empty-state-button"
                  onClick={onCreateTemplate}
                  className="h-9 rounded-xl px-4 gap-1.5"
                >
                  {t("list.createButton")}
                </Button>
              )
            }
          />
        ))}

      {/* Data rows */}
      {!isLoading &&
        templates.map(item => (
          <div
            key={item.id}
            data-testid={`product-template-row-${item.id}`}
            onClick={() => onRowClick?.(item)}
            className={`flex border-b border-border ${ROW_H} items-center hover:bg-muted/40 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
          >
            <div className={`${COL_PRODUCT} p-2`}>
              <p className="text-sm font-medium truncate text-foreground leading-tight">
                {item.template_name || "—"}
              </p>
              <p className="text-xs truncate text-muted-foreground leading-tight">
                {item.template_code || "—"}
              </p>
            </div>
            <div className={`${COL_FINANCING} p-2`}>
              <span className="text-sm text-foreground">
                {item.current_version
                  ? t(
                      `financingTypes.${item.current_version.financing_type}` as "financingTypes.full_refinancing"
                    )
                  : "—"}
              </span>
            </div>
            <div className={`${COL_CALCULATION} p-2`}>
              <span className="text-sm text-foreground">
                {item.current_version
                  ? t(
                      `calculationModels.${item.current_version.calculation_model}` as "calculationModels.annuity"
                    )
                  : "—"}
              </span>
            </div>
            <div className={`${COL_LTV_TERM} p-2`}>
              <span className="text-sm text-foreground">
                <LtvTermCell version={item.current_version} />
              </span>
            </div>
            <div className={`${COL_STATUS} p-2`}>
              {item.current_version ? (
                <TemplateVersionStatusBadge
                  status={item.current_version.version_status}
                />
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
            <div className={`${COL_VERSION} p-2`}>
              <span className="text-sm text-foreground">
                {item.current_version
                  ? `v${item.current_version.version_number}`
                  : "—"}
              </span>
            </div>
            <div className="shrink-0 p-2 flex items-center justify-center">
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </div>
        ))}
    </div>
  )
}

export { ProductTemplateTable }
