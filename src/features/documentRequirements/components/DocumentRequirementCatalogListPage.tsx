import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
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
import { ApiError } from "@/lib/api"
import { documentRequirementCatalogDetail } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { DOCUMENT_REQUIREMENT_CATALOG_MANAGE_ALLOWED_ROLES } from "@/features/documentRequirements/types"
import { DocumentRequirementCatalogFilterBar } from "@/features/documentRequirements/components/DocumentRequirementCatalogFilterBar"
import { DocumentRequirementCatalogTable } from "@/features/documentRequirements/components/DocumentRequirementCatalogTable"
import { CreateDocumentRequirementCatalogDialog } from "@/features/documentRequirements/components/CreateDocumentRequirementCatalogDialog"
import { useDocumentRequirementCatalogList } from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogList"
import {
  PAGE_SIZES,
  useDocumentRequirementCatalogListParams,
} from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogListParams"
import type { PageSize } from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogListParams"

export default function DocumentRequirementCatalogListPage() {
  const { t } = useTranslation("documentRequirements")
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const tenantId = currentUser?.tenant_id ?? undefined

  const canManage = Boolean(
    currentUser?.role &&
    DOCUMENT_REQUIREMENT_CATALOG_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
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
  } = useDocumentRequirementCatalogListParams()

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Product Template names are not on the list response — only product_template_id — so the
  // column and any future filter resolve against the same selectable-templates list the
  // Workflow Task Catalog uses. See open-questions.md.
  const { data: templates } = useSelectableProductTemplates()
  const templateNames = new Map(
    (templates?.items ?? []).map(item => [item.template_id, item.template_name])
  )

  const { data, isLoading, isError, error } = useDocumentRequirementCatalogList(
    tenantId,
    {
      page,
      per_page: perPage,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(filters.catalogType ? { catalog_type: filters.catalogType } : {}),
      ...(filters.processContext
        ? { process_context: filters.processContext }
        : {}),
    }
  )

  const rows = data?.items ?? []
  const totalPages = Math.max(1, data?.total_pages ?? 1)
  const pageNumbers = data ? buildPageNumbers(page, totalPages) : []

  return (
    <div className="p-8">
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
          <Button
            data-testid="create-document-requirement-catalog-button"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus size={16} />
            {t("list.createButton")}
          </Button>
        )}
      </div>

      <div className="mt-6">
        <DocumentRequirementCatalogFilterBar
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      <div className="mt-4">
        {isError && !isLoading && (
          <p
            data-testid="document-requirement-catalog-list-error"
            className="text-sm text-destructive py-8 text-center"
          >
            {error instanceof ApiError
              ? t(`errors.${error.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")}
          </p>
        )}
        {!isError && (
          <DocumentRequirementCatalogTable
            rows={rows}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            templateNames={templateNames}
            onRowClick={id => navigate(documentRequirementCatalogDetail(id))}
          />
        )}
      </div>

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

      {isCreateOpen && (
        <CreateDocumentRequirementCatalogDialog
          onOpenChange={open => setIsCreateOpen(open)}
        />
      )}
    </div>
  )
}
