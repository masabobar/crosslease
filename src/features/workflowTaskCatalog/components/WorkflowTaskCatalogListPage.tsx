import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, FileText, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaginationEllipsis } from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buildPageNumbers } from "@/lib/pagination"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { workflowTaskCatalogDetail } from "@/router/paths"
import { WORKFLOW_TASK_CATALOG_MANAGE_ALLOWED_ROLES } from "@/features/workflowTaskCatalog/types"
import { WorkflowTaskCatalogFilterBar } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogFilterBar"
import { WorkflowTaskCatalogTable } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogTable"
import { CreateWorkflowTaskCatalogDialog } from "@/features/workflowTaskCatalog/components/CreateWorkflowTaskCatalogDialog"
import { CatalogLifecycleActionDialog } from "@/features/workflowTaskCatalog/components/CatalogLifecycleActionDialog"
import {
  CATALOG_LAYER,
  EMPTY_CATALOG_FILTER_STATE,
  PAGE_SIZES,
  PLACEHOLDER_CATALOG_ROWS,
  PLACEHOLDER_PRODUCT_TEMPLATE_OPTIONS,
} from "@/features/workflowTaskCatalog/constants"
import type {
  CatalogLayer,
  CatalogLifecycleAction,
  CatalogRowAction,
  PageSize,
  WorkflowTaskCatalogFilterState,
  WorkflowTaskCatalogRow,
} from "@/features/workflowTaskCatalog/constants"

function matchesFilters(
  row: WorkflowTaskCatalogRow,
  search: string,
  filters: WorkflowTaskCatalogFilterState
): boolean {
  const trimmedSearch = search.trim().toLowerCase()
  if (trimmedSearch && !row.catalogName.toLowerCase().includes(trimmedSearch)) {
    return false
  }
  if (
    filters.catalogLayer.length > 0 &&
    !filters.catalogLayer.includes(row.catalogLayer)
  ) {
    return false
  }
  if (
    filters.entityType.length > 0 &&
    !filters.entityType.includes(row.entityType)
  ) {
    return false
  }
  if (
    filters.productTemplate.length > 0 &&
    (!row.productTemplateName ||
      !filters.productTemplate.includes(row.productTemplateName))
  ) {
    return false
  }
  if (
    filters.catalogState.length > 0 &&
    !filters.catalogState.includes(row.catalogState)
  ) {
    return false
  }
  // filters.versionState is presentational only — see constants.ts VERSION_STATE_OPTIONS
  // comment: no per-row version-state field exists on the placeholder rows to filter by.
  return true
}

export default function WorkflowTaskCatalogListPage() {
  const { t } = useTranslation("workflowTaskCatalog")
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()

  const canManage = Boolean(
    currentUser?.role &&
    WORKFLOW_TASK_CATALOG_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
  )

  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<WorkflowTaskCatalogFilterState>(
    EMPTY_CATALOG_FILTER_STATE
  )
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<PageSize>(25)
  const [createDialogLayer, setCreateDialogLayer] =
    useState<CatalogLayer | null>(null)
  const [lifecycleAction, setLifecycleAction] = useState<{
    mode: CatalogLifecycleAction
    row: WorkflowTaskCatalogRow
  } | null>(null)

  const filteredRows = PLACEHOLDER_CATALOG_ROWS.filter(row =>
    matchesFilters(row, search, filters)
  )
  const total = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const pageNumbers = buildPageNumbers(page, totalPages)
  const pagedRows = filteredRows.slice((page - 1) * perPage, page * perPage)
  const hasActiveFilters =
    Boolean(search.trim()) ||
    Object.values(filters).some(list => list.length > 0)

  function handleFiltersChange(
    update: Partial<WorkflowTaskCatalogFilterState>
  ) {
    setFilters(f => ({ ...f, ...update }))
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleRowAction(
    action: CatalogRowAction,
    row: WorkflowTaskCatalogRow
  ) {
    switch (action) {
      case "openDetail":
        navigate(workflowTaskCatalogDetail(row.id))
        return
      case "versionHistory":
        navigate(`${workflowTaskCatalogDetail(row.id)}?tab=versionHistory`)
        return
      case "migrationHistory":
        navigate(`${workflowTaskCatalogDetail(row.id)}?tab=migrationHistory`)
        return
      case "newDraftVersion":
        // No "new draft version" screen was in scope for this pass's Figma nodes —
        // left as a no-op pending that follow-up screen.
        return
      case "deprecate":
        setLifecycleAction({ mode: "deprecate", row })
        return
      case "archive":
        setLifecycleAction({ mode: "archive", row })
    }
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("list.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("list.subtitle")}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              data-testid="create-global-default-catalog-button"
              onClick={() => setCreateDialogLayer(CATALOG_LAYER.GLOBAL_DEFAULT)}
            >
              <FileText size={16} />
              {t("list.createGlobalDefaultButton")}
            </Button>
            <Button
              variant="outline"
              data-testid="create-product-specific-catalog-button"
              onClick={() =>
                setCreateDialogLayer(CATALOG_LAYER.PRODUCT_SPECIFIC)
              }
            >
              <Settings size={16} />
              {t("list.createProductSpecificButton")}
            </Button>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="mt-6">
        <WorkflowTaskCatalogFilterBar
          search={search}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          productTemplateOptions={PLACEHOLDER_PRODUCT_TEMPLATE_OPTIONS}
        />
      </div>

      {/* Table */}
      <div className="mt-4">
        <WorkflowTaskCatalogTable
          rows={pagedRows}
          hasActiveFilters={hasActiveFilters}
          canManage={canManage}
          onRowAction={handleRowAction}
        />
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("list.pagination.rowsPerPage")}
            </span>
            <Select
              value={String(perPage)}
              onValueChange={v => {
                setPerPage(Number(v) as PageSize)
                setPage(1)
              }}
            >
              <SelectTrigger
                data-testid="pagination-page-size-select"
                className="h-8 rounded-xl px-2 text-xs w-auto gap-1"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              data-testid="pagination-prev-button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-8 gap-1.5 rounded-xl pl-1.5 pr-2.5 text-sm"
            >
              <ChevronLeft size={16} />
              {t("list.pagination.previous")}
            </Button>

            {pageNumbers.map((item, idx) =>
              item === "..." ? (
                <PaginationEllipsis key={`ellipsis-${idx}`} />
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "outline" : "ghost"}
                  data-testid={`pagination-page-${item}`}
                  onClick={() => setPage(item)}
                  className="size-8 rounded-xl p-0 text-sm"
                >
                  {item}
                </Button>
              )
            )}

            <Button
              variant="ghost"
              data-testid="pagination-next-button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="h-8 gap-1.5 rounded-xl pl-2.5 pr-1.5 text-sm"
            >
              {t("list.pagination.next")}
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {createDialogLayer && (
        <CreateWorkflowTaskCatalogDialog
          layer={createDialogLayer}
          onOpenChange={open => !open && setCreateDialogLayer(null)}
        />
      )}

      {lifecycleAction && (
        <CatalogLifecycleActionDialog
          mode={lifecycleAction.mode}
          row={lifecycleAction.row}
          onOpenChange={open => !open && setLifecycleAction(null)}
        />
      )}
    </div>
  )
}
