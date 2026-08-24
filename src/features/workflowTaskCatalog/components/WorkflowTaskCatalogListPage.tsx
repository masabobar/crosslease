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
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants"
import { workflowTaskCatalogDetail } from "@/router/paths"
import { WORKFLOW_TASK_CATALOG_MANAGE_ALLOWED_ROLES } from "@/features/workflowTaskCatalog/types"
import { WorkflowTaskCatalogFilterBar } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogFilterBar"
import { WorkflowTaskCatalogTable } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogTable"
import { CreateWorkflowTaskCatalogDialog } from "@/features/workflowTaskCatalog/components/CreateWorkflowTaskCatalogDialog"
import { useWorkflowTaskCatalogList } from "@/features/workflowTaskCatalog/hooks/useWorkflowTaskCatalogList"
import {
  PAGE_SIZES,
  useWorkflowTaskCatalogListParams,
} from "@/features/workflowTaskCatalog/hooks/useWorkflowTaskCatalogListParams"
import type { PageSize } from "@/features/workflowTaskCatalog/hooks/useWorkflowTaskCatalogListParams"
import { CatalogLayerSchema } from "@/features/workflowTaskCatalog/api/schema"
import type { CatalogLayer } from "@/features/workflowTaskCatalog/api/schema"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

export default function WorkflowTaskCatalogListPage() {
  const { t } = useTranslation("workflowTaskCatalog")
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()

  const canManage = Boolean(
    currentUser?.role &&
    WORKFLOW_TASK_CATALOG_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
  )

  const {
    page,
    perPage,
    search,
    filters,
    hasActiveFilters,
    setPage,
    setPerPage,
    setSearch,
    setFilters,
  } = useWorkflowTaskCatalogListParams()

  // Debounced before it reaches the query key: the field re-renders on every keystroke, but
  // only the settled value is worth a request.
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  const [createDialogLayer, setCreateDialogLayer] =
    useState<CatalogLayer | null>(null)

  // Product Template names are not on the list response — only entity_id — so US 15.22's
  // "Applicable Product Template" column and filter are resolved against the selectable
  // templates list. See open-questions.md Q-042: the durable fix is BE-side.
  const { data: templates } = useSelectableProductTemplates()
  const templateItems = templates?.items ?? []
  const templateNames = new Map(
    templateItems.map(item => [item.template_id, item.template_name])
  )
  const productTemplateOptions = templateItems.map(item => ({
    value: item.template_id,
    label: item.template_name,
  }))

  const { data, isLoading, isError, error } = useWorkflowTaskCatalogList({
    page,
    per_page: perPage,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(filters.catalogLayer.length
      ? { catalog_layer: filters.catalogLayer }
      : {}),
    ...(filters.entityType.length ? { entity_type: filters.entityType } : {}),
    ...(filters.productTemplate.length
      ? { product_template_id: filters.productTemplate }
      : {}),
    ...(filters.catalogState.length
      ? { catalog_state: filters.catalogState }
      : {}),
  })

  const rows = data?.items ?? []
  const totalPages = Math.max(1, data?.total_pages ?? 1)
  const pageNumbers = data ? buildPageNumbers(page, totalPages) : []

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
              onClick={() =>
                setCreateDialogLayer(CatalogLayerSchema.enum.global_default)
              }
            >
              <FileText size={16} />
              {t("list.createGlobalDefaultButton")}
            </Button>
            <Button
              variant="outline"
              data-testid="create-product-specific-catalog-button"
              onClick={() =>
                setCreateDialogLayer(CatalogLayerSchema.enum.product_specific)
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
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
          productTemplateOptions={productTemplateOptions}
        />
      </div>

      {/* Table */}
      <div className="mt-4">
        {isError && !isLoading && (
          <p
            data-testid="workflow-task-catalog-list-error"
            className="text-sm text-destructive py-8 text-center"
          >
            {resolveApiErrorMessage(error, t)}
          </p>
        )}
        {!isError && (
          <WorkflowTaskCatalogTable
            rows={rows}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            templateNames={templateNames}
            onOpenDetail={id => navigate(workflowTaskCatalogDetail(id))}
          />
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="mt-4 flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("list.pagination.rowsPerPage")}
            </span>
            <Select
              value={String(perPage)}
              onValueChange={v => setPerPage(Number(v) as PageSize)}
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
    </div>
  )
}
