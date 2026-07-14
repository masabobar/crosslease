import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { TableEmptyState } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { TemplateVersionStatusBadge } from "@/features/productTemplates/components/TemplateVersionStatusBadge"
import type { TemplateListItem } from "@/features/productTemplates/api/schema"

const COL_PRODUCT = "flex-1 min-w-[180px]"
const COL_FINANCING = "w-[170px] shrink-0"
const COL_CALCULATION = "w-[120px] shrink-0"
const COL_LTV_TERM = "w-[150px] shrink-0"
const COL_STATUS = "w-[110px] shrink-0"
const COL_VERSION = "w-[70px] shrink-0"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

function ltvAndTerm(item: TemplateListItem, maxLtvPrefix: string): string {
  const v = item.current_version
  if (!v || v.max_ltv_ratio === null || v.max_ltv_ratio === undefined)
    return "—"
  const term =
    v.min_term_months !== null &&
    v.min_term_months !== undefined &&
    v.max_term_months !== null &&
    v.max_term_months !== undefined
      ? `${v.min_term_months}-${v.max_term_months}m`
      : null
  return term
    ? `${maxLtvPrefix} ${v.max_ltv_ratio}% / ${term}`
    : `${maxLtvPrefix} ${v.max_ltv_ratio}%`
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
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="product-template-table"
    >
      {/* Header */}
      <div className="flex border-b border-border h-10 items-center">
        <div
          className={`${COL_PRODUCT} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.product")}
        </div>
        <div
          className={`${COL_FINANCING} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.financingType")}
        </div>
        <div
          className={`${COL_CALCULATION} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.calculation")}
        </div>
        <div
          className={`${COL_LTV_TERM} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.ltvAndTerm")}
        </div>
        <div
          className={`${COL_STATUS} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.status")}
        </div>
        <div
          className={`${COL_VERSION} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.version")}
        </div>
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
              {/* NOTE: TemplateListItem has no template_name on the BE (only
                  template_code) — see schema.ts comment. Renders the code as the
                  primary label until the BE maps template_name through. */}
              <p className="text-sm font-medium truncate text-foreground leading-tight">
                {item.template_code}
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
                {ltvAndTerm(item, t("list.table.maxLtvPrefix"))}
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
                {item.current_version?.version_number ?? "—"}
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
