import { useState } from "react"
import { parseISO } from "date-fns"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import {
  Building2Icon,
  Check,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DatePicker } from "@/components/ui/date-picker"
import { FilterButton } from "@/components/ui/filter-button"
import { FilterPill } from "@/components/ui/filter-pill"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/formatters"
import { COUNTRIES, countryName } from "@/lib/countries"
import { TenantTable } from "@/features/tenants/components/TenantTable"
import {
  fetchTenants,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { TenantStatus, TenantType } from "@/features/tenants/api/schema"
import { PATHS, tenantDetail } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { TENANT_CREATE_ALLOWED_ROLES } from "@/features/tenants/types"
import { SYSTEM_ADMIN_ROLE } from "@/features/users/types"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

const PAGE_SIZE = 20

const STATUS_OPTIONS: TenantStatus[] = [
  "active",
  "draft",
  "suspended",
  "archived",
  "rejected",
  "expired",
]

const TYPE_OPTIONS: TenantType[] = ["bank", "bank_entity", "bank_branch_group"]

export default function TenantManagementPage() {
  const { t } = useTranslation("tenants")
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.role === SYSTEM_ADMIN_ROLE
  const canCreateTenant =
    !!currentUser && TENANT_CREATE_ALLOWED_ROLES.includes(currentUser.role)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilters, setStatusFilters] = useState<TenantStatus[]>([])
  const [typeFilters, setTypeFilters] = useState<TenantType[]>([])
  const [countryFilter, setCountryFilter] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)
  const [countrySearch, setCountrySearch] = useState("")

  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(
        c =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRIES

  const params = {
    page,
    per_page: PAGE_SIZE,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(statusFilters.length > 0 ? { status: statusFilters } : {}),
    ...(typeFilters.length > 0 ? { tenant_type: typeFilters } : {}),
    ...(countryFilter ? { country: countryFilter } : {}),
    ...(fromDate ? { from_date: fromDate } : {}),
    ...(toDate ? { to_date: toDate } : {}),
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: TENANTS_QUERY_KEYS.list(params),
    queryFn: () => fetchTenants(params),
    staleTime: THIRTY_SECONDS_MS,
  })

  const tenants = data?.tenants ?? []
  const totalPages = data?.total_pages ?? 1
  const total = data?.total ?? 0

  const hasActiveFilters =
    !!search.trim() ||
    statusFilters.length > 0 ||
    typeFilters.length > 0 ||
    !!countryFilter ||
    !!fromDate ||
    !!toDate

  function toggleStatus(s: TenantStatus) {
    setStatusFilters(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
    setPage(1)
  }

  function toggleType(type: TenantType) {
    setTypeFilters(prev =>
      prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]
    )
    setPage(1)
  }

  function clearAllFilters() {
    setSearch("")
    setStatusFilters([])
    setTypeFilters([])
    setCountryFilter(null)
    setCountrySearch("")
    setFromDate(null)
    setToDate(null)
    setPage(1)
  }

  const dateRangeLabel = [
    fromDate ? formatDate(fromDate) : null,
    toDate ? formatDate(toDate) : null,
  ]
    .filter(Boolean)
    .join(" – ")

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-start justify-between px-8 py-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("list.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("list.subtitle")}
          </p>
        </div>
        {canCreateTenant && (
          <Button
            data-testid="create-tenant-button"
            onClick={() => navigate(PATHS.TENANT_MANAGEMENT_CREATE)}
            className="h-9 rounded-xl px-4 gap-1.5"
          >
            <Building2Icon size={16} />
            {t("list.createButton")}
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-8 pb-4">
        <SearchInput
          data-testid="filter-search"
          placeholder={t("list.filters.searchPlaceholder")}
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="h-8 text-sm w-52"
        />
        <FilterButton
          data-testid="filter-status"
          label={t("list.filters.status")}
          count={statusFilters.length}
          contentClassName="w-44"
        >
          {STATUS_OPTIONS.map(s => {
            const checked = statusFilters.includes(s)
            return (
              <Button
                key={s}
                variant="ghost"
                data-testid={`filter-status-${s}`}
                onClick={() => toggleStatus(s)}
                className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
              >
                <span
                  className={cn(
                    "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
                    checked ? "bg-primary border-primary" : "border-border"
                  )}
                >
                  {checked && <Check size={10} className="text-white" />}
                </span>
                <span className="text-sm text-foreground">
                  {t(`statuses.${s}` as "statuses.active")}
                </span>
              </Button>
            )
          })}
        </FilterButton>

        <FilterButton
          data-testid="filter-type"
          label={t("list.filters.type")}
          count={typeFilters.length}
          contentClassName="w-52"
        >
          {TYPE_OPTIONS.map(type => {
            const checked = typeFilters.includes(type)
            return (
              <Button
                key={type}
                variant="ghost"
                data-testid={`filter-type-${type}`}
                onClick={() => toggleType(type)}
                className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
              >
                <span
                  className={cn(
                    "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
                    checked ? "bg-primary border-primary" : "border-border"
                  )}
                >
                  {checked && <Check size={10} className="text-white" />}
                </span>
                <span className="text-sm text-foreground">
                  {t(`tenantTypes.${type}` as "tenantTypes.bank")}
                </span>
              </Button>
            )
          })}
        </FilterButton>

        <FilterButton
          data-testid="filter-country"
          label={t("list.filters.country")}
          count={countryFilter ? 1 : 0}
          contentClassName="w-56"
        >
          <div className="px-2 pt-2 pb-1 border-b border-border">
            <Input
              data-testid="filter-country-search"
              placeholder={t("list.filters.countrySearchPlaceholder")}
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              className="h-7 text-sm"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filteredCountries.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {t("list.filters.noCountriesFound")}
              </p>
            ) : (
              filteredCountries.map(({ code, name }) => {
                const selected = countryFilter === code
                return (
                  <Button
                    key={code}
                    variant="ghost"
                    data-testid={`filter-country-option-${code}`}
                    onClick={() => {
                      setCountryFilter(selected ? null : code)
                      setCountrySearch("")
                      setPage(1)
                    }}
                    className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
                  >
                    <span
                      className={cn(
                        "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
                        selected ? "bg-primary border-primary" : "border-border"
                      )}
                    >
                      {selected && <Check size={10} className="text-white" />}
                    </span>
                    <span className="text-sm text-foreground">{name}</span>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      {code}
                    </span>
                  </Button>
                )
              })
            )}
          </div>
        </FilterButton>

        <FilterButton
          data-testid="filter-date-created"
          label={t("list.filters.dateCreated")}
          count={[fromDate, toDate].filter(Boolean).length}
          icon="calendar"
          contentClassName="w-72 py-0"
        >
          <div className="p-3">
            <div className="flex gap-2">
              <DatePicker
                value={fromDate ?? undefined}
                onChange={v => {
                  const newFrom = parseISO(v)
                  const currentTo = toDate ? parseISO(toDate) : null
                  setFromDate(v)
                  if (currentTo && currentTo < newFrom) setToDate(null)
                  setPage(1)
                }}
                placeholder={t("list.filters.from")}
                maxDate={new Date()}
              />
              <DatePicker
                value={toDate ?? undefined}
                onChange={v => {
                  setToDate(v)
                  setPage(1)
                }}
                placeholder={t("list.filters.to")}
                maxDate={new Date()}
                minDate={fromDate ? parseISO(fromDate) : undefined}
              />
            </div>
          </div>
        </FilterButton>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-8 pb-4">
          {search.trim() && (
            <FilterPill
              label={t("list.filterPills.search", { value: search.trim() })}
              onRemove={() => {
                setSearch("")
                setPage(1)
              }}
              data-testid="filter-pill-remove-search"
            />
          )}
          {statusFilters.map(s => (
            <FilterPill
              key={`status-${s}`}
              label={t("list.filterPills.status", {
                value: t(`statuses.${s}` as "statuses.active"),
              })}
              onRemove={() => toggleStatus(s)}
              data-testid={`filter-pill-remove-status-${s}`}
            />
          ))}
          {typeFilters.map(type => (
            <FilterPill
              key={`type-${type}`}
              label={t("list.filterPills.type", {
                value: t(`tenantTypes.${type}` as "tenantTypes.bank"),
              })}
              onRemove={() => toggleType(type)}
              data-testid={`filter-pill-remove-type-${type}`}
            />
          ))}
          {countryFilter && (
            <FilterPill
              label={t("list.filterPills.country", {
                value: countryName(countryFilter),
              })}
              onRemove={() => {
                setCountryFilter(null)
                setPage(1)
              }}
              data-testid="filter-pill-remove-country"
            />
          )}
          {(fromDate || toDate) && (
            <FilterPill
              label={t("list.filterPills.dateRange", {
                range: dateRangeLabel,
              })}
              onRemove={() => {
                setFromDate(null)
                setToDate(null)
                setPage(1)
              }}
              data-testid="filter-pill-remove-date"
            />
          )}
          <Button
            type="button"
            variant="ghost"
            data-testid="filters-clear-all"
            onClick={clearAllFilters}
            className="h-auto px-2 py-0 text-xs font-normal text-destructive hover:text-destructive hover:bg-transparent hover:opacity-80 transition-opacity"
          >
            {t("list.filters.clearAll")}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 pb-4">
        {isError ? (
          <p className="text-sm text-destructive py-8 text-center">
            {t("errors.generic")}
          </p>
        ) : (
          <TenantTable
            tenants={tenants}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            isAdmin={isAdmin}
            onRowClick={tenant => navigate(tenantDetail(tenant.id))}
            onCreateTenant={
              canCreateTenant
                ? () => navigate(PATHS.TENANT_MANAGEMENT_CREATE)
                : undefined
            }
          />
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-end gap-3 px-8 py-3 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {t("list.pagination.page", { page, total: totalPages })}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            data-testid="pagination-prev"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeftIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            data-testid="pagination-next"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
