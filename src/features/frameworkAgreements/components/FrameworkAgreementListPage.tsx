import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants"
import { PaginationEllipsis } from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buildPageNumbers } from "@/lib/pagination"
import { downloadBlob } from "@/lib/download"
import { FrameworkAgreementTable } from "@/features/frameworkAgreements/components/FrameworkAgreementTable"
import { FrameworkAgreementDetailDrawer } from "@/features/frameworkAgreements/components/FrameworkAgreementDetailDrawer"
import { useFrameworkAgreementList } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementList"
import { useFrameworkAgreementLcPartners } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementLcPartners"
import { useExportFrameworkAgreementsCsv } from "@/features/frameworkAgreements/hooks/useExportFrameworkAgreementsCsv"
import {
  useFrameworkAgreementListParams,
  PAGE_SIZES,
} from "@/features/frameworkAgreements/hooks/useFrameworkAgreementListParams"
import type { PageSize } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementListParams"
import { FALifecycleStatusSchema } from "@/features/frameworkAgreements/api/schema"
import type {
  FAListItem,
  FALifecycleStatus,
} from "@/features/frameworkAgreements/api/schema"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES } from "@/features/frameworkAgreements/types"
import { PATHS } from "@/router/paths"

const ALL_VALUE = "all"
const EXPORT_FILE_NAME = "framework-agreements.csv"

export default function FrameworkAgreementListPage() {
  const { t } = useTranslation("frameworkAgreements")
  const navigate = useNavigate()
  const [selectedAgreement, setSelectedAgreement] = useState<FAListItem | null>(
    null
  )
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const {
    page,
    perPage,
    search,
    statusFilter,
    lcPartnerId,
    setPage,
    setPerPage,
    setSearch,
    setStatusFilter,
    setLcPartnerId,
  } = useFrameworkAgreementListParams()

  // Debounced before it reaches the query key: the field re-renders on every keystroke, but
  // only the settled value is worth a request.
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  const { data, isLoading, isError } = useFrameworkAgreementList({
    page,
    per_page: perPage,
    ...(debouncedSearch.trim() ? { q: debouncedSearch.trim() } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(lcPartnerId ? { lc_partner_id: lcPartnerId } : {}),
  })
  const { data: lcPartnersData, isError: isLcPartnersError } =
    useFrameworkAgreementLcPartners()
  const { data: currentUser } = useCurrentUser()
  const canManageFrameworkAgreement = Boolean(
    currentUser?.role &&
    FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
  )
  const exportMutation = useExportFrameworkAgreementsCsv()

  const agreements = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const pageNumbers = data ? buildPageNumbers(page, totalPages) : []
  const hasActiveFilters = !!search.trim() || !!statusFilter || !!lcPartnerId

  function handleRowClick(agreement: FAListItem) {
    setSelectedAgreement(agreement)
    setIsDrawerOpen(true)
  }

  function handleCreateAgreement() {
    navigate(PATHS.FRAMEWORK_AGREEMENT_CREATE)
  }

  function handleExportCsv() {
    exportMutation.mutate(
      {
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(lcPartnerId ? { lc_partner_id: lcPartnerId } : {}),
      },
      {
        onSuccess: blob => downloadBlob(blob, EXPORT_FILE_NAME),
        onError: err => {
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")
          )
        },
      }
    )
  }

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            data-testid="export-framework-agreements-csv-button"
            onClick={handleExportCsv}
            disabled={exportMutation.isPending}
            className="h-9 rounded-xl px-4 gap-1.5"
          >
            <Download size={16} />
            {t("list.exportButton")}
          </Button>
          {canManageFrameworkAgreement && (
            <Button
              data-testid="create-framework-agreement-button"
              onClick={handleCreateAgreement}
              className="h-9 rounded-xl px-4 gap-1.5"
            >
              <Plus size={16} />
              {t("list.createButton")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-6">
        <SearchInput
          data-testid="fa-filter-search"
          placeholder={t("list.filters.searchPlaceholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-[288px]"
        />

        <Select
          value={statusFilter ?? ALL_VALUE}
          onValueChange={v =>
            setStatusFilter(v === ALL_VALUE ? null : (v as FALifecycleStatus))
          }
        >
          <SelectTrigger data-testid="fa-filter-status" className="w-[180px]">
            <SelectValue>
              {statusFilter
                ? t(`statuses.${statusFilter}`)
                : t("list.filters.allStatuses")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>
              {t("list.filters.allStatuses")}
            </SelectItem>
            {FALifecycleStatusSchema.options.map(status => (
              <SelectItem key={status} value={status}>
                {t(`statuses.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col gap-1">
          <Select
            value={lcPartnerId ?? ALL_VALUE}
            onValueChange={v => setLcPartnerId(v === ALL_VALUE ? null : v)}
            disabled={isLcPartnersError}
          >
            <SelectTrigger data-testid="fa-filter-lc" className="w-[200px]">
              <SelectValue>
                {lcPartnerId
                  ? (lcPartnersData?.items ?? []).find(
                      lc => lc.id === lcPartnerId
                    )?.legal_name
                  : t("list.filters.allLeasingCompanies")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>
                {t("list.filters.allLeasingCompanies")}
              </SelectItem>
              {(lcPartnersData?.items ?? []).map(lc => (
                <SelectItem key={lc.id} value={lc.id}>
                  {lc.legal_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLcPartnersError && (
            <p
              className="text-xs text-destructive"
              data-testid="fa-filter-lc-error"
            >
              {t("errors.generic")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        {isError && !isLoading && (
          <p className="text-sm text-destructive py-8 text-center">
            {t("errors.generic")}
          </p>
        )}
        {!isError && (
          <FrameworkAgreementTable
            agreements={agreements}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            onRowClick={handleRowClick}
            onCreateAgreement={
              canManageFrameworkAgreement ? handleCreateAgreement : undefined
            }
          />
        )}
      </div>

      {data && (
        <div className="mt-4 flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <Select
              value={String(perPage)}
              onValueChange={v => setPerPage(Number(v) as PageSize)}
            >
              <SelectTrigger
                data-testid="fa-pagination-page-size-select"
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
              data-testid="fa-pagination-prev-button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-8 gap-1.5 rounded-xl pl-1.5 pr-2.5 text-sm"
            >
              <ChevronLeft size={16} />
            </Button>

            {pageNumbers.map((item, idx) =>
              item === "..." ? (
                <PaginationEllipsis key={`ellipsis-${idx}`} />
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "outline" : "ghost"}
                  data-testid={`fa-pagination-page-${item}`}
                  onClick={() => setPage(item)}
                  className="size-8 rounded-xl p-0 text-sm"
                >
                  {item}
                </Button>
              )
            )}

            <Button
              variant="ghost"
              data-testid="fa-pagination-next-button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="h-8 gap-1.5 rounded-xl pl-2.5 pr-1.5 text-sm"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      <FrameworkAgreementDetailDrawer
        agreement={selectedAgreement}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}
