import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { PaginationEllipsis } from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buildPageNumbers } from "@/lib/pagination"
import { ProductTemplateTable } from "@/features/productTemplates/components/ProductTemplateTable"
import { ProductTemplateDetailDrawer } from "@/features/productTemplates/components/ProductTemplateDetailDrawer"
import { useProductTemplateList } from "@/features/productTemplates/hooks/useProductTemplateList"
import {
  useProductTemplateListParams,
  PAGE_SIZES,
} from "@/features/productTemplates/hooks/useProductTemplateListParams"
import type { PageSize } from "@/features/productTemplates/hooks/useProductTemplateListParams"
import { PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES } from "@/features/productTemplates/types"
import { TemplateStatusSchema } from "@/features/productTemplates/api/schema"
import type {
  TemplateListItem,
  TemplateStatus,
} from "@/features/productTemplates/api/schema"
import { PATHS } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { SYSTEM_ADMIN_ROLE } from "@/features/users/types"
import { TenantScopeGate } from "@/components/shared/TenantScopeGate"
import { useTenantSelectionStore } from "@/store/tenantSelectionStore"
import {
  isProductTemplateNotFoundError,
  isModuleNotActiveError,
} from "@/features/productTemplates/utils"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { TableEmptyState } from "@/components/ui/empty"
import { ApiError } from "@/lib/api"

const ALL_STATUSES_VALUE = "all"

export default function ProductTemplateListPage() {
  const { t } = useTranslation("productTemplates")
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateListItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { data: currentUser } = useCurrentUser()
  const selectedTenantId = useTenantSelectionStore(s => s.selectedTenantId)
  const tenantId =
    currentUser?.tenant_id ??
    (currentUser?.role === SYSTEM_ADMIN_ROLE ? selectedTenantId : null)
  const canManageDraft = Boolean(
    currentUser?.role &&
    PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES.includes(currentUser.role)
  )

  const {
    page,
    perPage,
    search,
    statusFilter,
    setPage,
    setPerPage,
    setSearch,
    setStatusFilter,
  } = useProductTemplateListParams()

  const { data, isLoading, isError, error } = useProductTemplateList(tenantId, {
    page,
    per_page: perPage,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const templates = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const pageNumbers = data ? buildPageNumbers(page, totalPages) : []
  const hasActiveFilters = !!search.trim() || !!statusFilter

  function handleRowClick(template: TemplateListItem) {
    setSelectedTemplate(template)
    setIsDrawerOpen(true)
  }

  function handleCreateTemplate() {
    navigate(PATHS.PRODUCT_TEMPLATE_CREATE)
  }

  if (isProductTemplateNotFoundError(error)) {
    return <NotFoundPage />
  }

  if (isModuleNotActiveError(error)) {
    return (
      <div className="p-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("list.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("list.subtitle")}
          </p>
        </div>
        <div className="mt-4">
          <TableEmptyState
            title={t("list.moduleNotActive.title")}
            description={t("list.moduleNotActive.description")}
          />
        </div>
      </div>
    )
  }

  if (currentUser && !tenantId) {
    return (
      <TenantScopeGate
        isSystemAdmin={currentUser.role === SYSTEM_ADMIN_ROLE}
        selectTenantPrompt={t("list.selectTenantPrompt")}
        tenantRequiredMessage={t("list.tenantRequired")}
      />
    )
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
        {canManageDraft && !isLoading && (
          <Button
            data-testid="create-template-button"
            onClick={handleCreateTemplate}
            className="h-9 rounded-xl px-4 gap-1.5"
          >
            <Plus size={16} />
            {t("list.createButton")}
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4 mt-6">
        <SearchInput
          data-testid="filter-search"
          placeholder={t("list.filters.searchPlaceholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-[288px]"
        />

        <Select
          value={statusFilter ?? ALL_STATUSES_VALUE}
          onValueChange={v =>
            setStatusFilter(
              v === ALL_STATUSES_VALUE ? null : (v as TemplateStatus)
            )
          }
        >
          <SelectTrigger
            data-testid="filter-status"
            className="w-[200px] px-[10px] py-[4px]"
          >
            <SelectValue>
              {statusFilter
                ? t(
                    `versionStatuses.${statusFilter}` as "versionStatuses.draft"
                  )
                : t("list.filters.allStatuses")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES_VALUE}>
              {t("list.filters.allStatuses")}
            </SelectItem>
            {TemplateStatusSchema.options.map(status => (
              <SelectItem key={status} value={status}>
                {t(`versionStatuses.${status}` as "versionStatuses.draft")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="mt-4">
        {isError && !isLoading && (
          <p className="text-sm text-destructive py-8 text-center">
            {error instanceof ApiError
              ? t(`errors.${error.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")}
          </p>
        )}
        {!isError && (
          <ProductTemplateTable
            templates={templates}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            onRowClick={handleRowClick}
            onCreateTemplate={canManageDraft ? handleCreateTemplate : undefined}
          />
        )}
      </div>

      {/* Pagination */}
      {data && (
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

      <ProductTemplateDetailDrawer
        templateId={selectedTemplate?.id ?? null}
        currentVersion={selectedTemplate?.current_version ?? null}
        canManageDraft={canManageDraft}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}
