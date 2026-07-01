import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Upload,
} from "lucide-react"
import { ConfirmPartnerDialog } from "@/features/partners/components/ConfirmPartnerDialog"
import { RejectPartnerDialog } from "@/features/partners/components/RejectPartnerDialog"
import { ArchivePartnerDialog } from "@/features/partners/components/ArchivePartnerDialog"
import type { PartnerListItem } from "@/features/partners/api/schema"
import type { PartnerActionType } from "@/features/partners/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import { FilterPill } from "@/components/ui/filter-pill"
import { PaginationEllipsis } from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { COUNTRIES, countryName } from "@/lib/countries"
import { buildPageNumbers } from "@/lib/pagination"
import { PartnerTable } from "@/features/partners/components/PartnerTable"
import { usePartnerList } from "@/features/partners/hooks/usePartnerList"
import {
  usePartnerListParams,
  PAGE_SIZES,
} from "@/features/partners/hooks/usePartnerListParams"
import type { PageSize } from "@/features/partners/hooks/usePartnerListParams"
import type {
  PartnerStatus,
  PartnerRole,
  UboCompletenessStatus,
} from "@/features/partners/api/schema"
import { PATHS, partnerDetail } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { PARTNER_SUBMIT_ALLOWED_ROLES } from "@/features/partners/types"

const STATUS_OPTIONS: PartnerStatus[] = [
  "draft",
  "pending_confirmation",
  "confirmed",
  "rejected",
  "archived",
  "pending_archive",
]

const ROLE_OPTIONS: PartnerRole[] = [
  "lessee",
  "guarantor",
  "supplier",
  "leasing_company",
  "bank_entity",
  "ubo_related_person",
]

const UBO_OPTIONS: UboCompletenessStatus[] = ["missing", "partial", "complete"]

export default function PartnerRegistryPage() {
  const { t } = useTranslation("partners")
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const canSubmit =
    !!currentUser && PARTNER_SUBMIT_ALLOWED_ROLES.includes(currentUser.role)

  const [countrySearch, setCountrySearch] = useState("")
  const [activeDialog, setActiveDialog] = useState<PartnerActionType | null>(
    null
  )
  const [selectedPartner, setSelectedPartner] =
    useState<PartnerListItem | null>(null)

  function handleAction(type: PartnerActionType, partner: PartnerListItem) {
    setSelectedPartner(partner)
    setActiveDialog(type)
  }

  function handleDialogClose() {
    setActiveDialog(null)
    setSelectedPartner(null)
  }

  const {
    page,
    perPage,
    search,
    statusFilters,
    roleFilters,
    countryFilter,
    uboFilters,
    setPage,
    setPerPage,
    setSearch,
    setStatusFilters,
    setRoleFilters,
    setCountryFilter,
    setUboFilters,
    clearAllFilters,
  } = usePartnerListParams()

  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(
        c =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRIES

  const { data, isLoading, isError } = usePartnerList({
    limit: perPage,
    offset: (page - 1) * perPage,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(statusFilters.length > 0 ? { status: statusFilters } : {}),
    ...(roleFilters.length > 0 ? { role: roleFilters } : {}),
    ...(countryFilter ? { country: [countryFilter] } : {}),
    ...(uboFilters.length > 0 ? { ubo_status: uboFilters } : {}),
  })

  const partners = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const pageNumbers = data ? buildPageNumbers(page, totalPages) : []

  const hasActiveFilters =
    !!search.trim() ||
    statusFilters.length > 0 ||
    roleFilters.length > 0 ||
    !!countryFilter ||
    uboFilters.length > 0

  function toggleStatus(s: PartnerStatus) {
    setStatusFilters(
      statusFilters.includes(s)
        ? statusFilters.filter(x => x !== s)
        : [...statusFilters, s]
    )
  }

  function toggleRole(role: PartnerRole) {
    setRoleFilters(
      roleFilters.includes(role)
        ? roleFilters.filter(x => x !== role)
        : [...roleFilters, role]
    )
  }

  function toggleUbo(u: UboCompletenessStatus) {
    setUboFilters(
      uboFilters.includes(u)
        ? uboFilters.filter(x => x !== u)
        : [...uboFilters, u]
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
        {canSubmit && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              data-testid="import-partners-button"
              className="h-9 rounded-xl px-2.5 gap-1.5"
            >
              <Upload size={16} />
              {t("list.importButton")}
            </Button>
            <Button
              data-testid="submit-partner-button"
              onClick={() => navigate(PATHS.PARTNER_SUBMIT)}
              className="h-9 rounded-xl px-4 gap-1.5"
            >
              <Handshake size={16} />
              {t("list.addButton")}
            </Button>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-6 mt-6">
        <SearchInput
          data-testid="filter-search"
          placeholder={t("list.filters.searchPlaceholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-[288px]"
        />

        <div className="flex items-center gap-2">
          <FilterButton
            data-testid="filter-status"
            label={t("list.filters.status")}
            count={statusFilters.length}
            contentClassName="w-52"
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
                    {t(`status.${s}` as "status.draft")}
                  </span>
                </Button>
              )
            })}
          </FilterButton>

          <FilterButton
            data-testid="filter-role"
            label={t("list.filters.role")}
            count={roleFilters.length}
            contentClassName="w-52"
          >
            {ROLE_OPTIONS.map(role => {
              const checked = roleFilters.includes(role)
              return (
                <Button
                  key={role}
                  variant="ghost"
                  data-testid={`filter-role-${role}`}
                  onClick={() => toggleRole(role)}
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
                    {t(`role.${role}` as "role.lessee")}
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
                      }}
                      className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
                    >
                      <span
                        className={cn(
                          "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
                          selected
                            ? "bg-primary border-primary"
                            : "border-border"
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
            data-testid="filter-ubo"
            label={t("list.filters.uboStatus")}
            count={uboFilters.length}
            contentClassName="w-44"
          >
            {UBO_OPTIONS.map(u => {
              const checked = uboFilters.includes(u)
              return (
                <Button
                  key={u}
                  variant="ghost"
                  data-testid={`filter-ubo-${u}`}
                  onClick={() => toggleUbo(u)}
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
                    {t(`uboStatus.${u}` as "uboStatus.missing")}
                  </span>
                </Button>
              )
            })}
          </FilterButton>
        </div>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {search.trim() && (
            <FilterPill
              label={t("list.filterPills.search", { value: search.trim() })}
              onRemove={() => setSearch("")}
              data-testid="filter-pill-remove-search"
            />
          )}
          {statusFilters.map(s => (
            <FilterPill
              key={`status-${s}`}
              label={t("list.filterPills.status", {
                value: t(`status.${s}` as "status.draft"),
              })}
              onRemove={() => toggleStatus(s)}
              data-testid={`filter-pill-remove-status-${s}`}
            />
          ))}
          {roleFilters.map(role => (
            <FilterPill
              key={`role-${role}`}
              label={t("list.filterPills.role", {
                value: t(`role.${role}` as "role.lessee"),
              })}
              onRemove={() => toggleRole(role)}
              data-testid={`filter-pill-remove-role-${role}`}
            />
          ))}
          {countryFilter && (
            <FilterPill
              label={t("list.filterPills.country", {
                value: countryName(countryFilter),
              })}
              onRemove={() => setCountryFilter(null)}
              data-testid="filter-pill-remove-country"
            />
          )}
          {uboFilters.map(u => (
            <FilterPill
              key={`ubo-${u}`}
              label={t("list.filterPills.uboStatus", {
                value: t(`uboStatus.${u}` as "uboStatus.missing"),
              })}
              onRemove={() => toggleUbo(u)}
              data-testid={`filter-pill-remove-ubo-${u}`}
            />
          ))}
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
      <div className="mt-4">
        {isError && !isLoading && (
          <p className="text-sm text-destructive py-8 text-center">
            {t("errors.generic")}
          </p>
        )}
        {!isError && (
          <PartnerTable
            partners={partners}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            canAction={canSubmit}
            onAction={handleAction}
            onRowClick={partner => navigate(partnerDetail(partner.partner_id))}
            onSubmitPartner={
              canSubmit ? () => navigate(PATHS.PARTNER_SUBMIT) : undefined
            }
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

      {selectedPartner && (
        <>
          <ConfirmPartnerDialog
            open={activeDialog === "confirm"}
            onOpenChange={open => !open && handleDialogClose()}
            partnerId={selectedPartner.partner_id}
            partnerName={selectedPartner.display_name}
            partnerStatus={selectedPartner.status}
          />
          <RejectPartnerDialog
            open={activeDialog === "reject"}
            onOpenChange={open => !open && handleDialogClose()}
            partnerId={selectedPartner.partner_id}
            partnerName={selectedPartner.display_name}
            partnerStatus={selectedPartner.status}
          />
          <ArchivePartnerDialog
            open={activeDialog === "archive"}
            onOpenChange={open => !open && handleDialogClose()}
            partnerId={selectedPartner.partner_id}
            partnerName={selectedPartner.display_name}
            partnerStatus={selectedPartner.status}
          />
        </>
      )}
    </div>
  )
}
