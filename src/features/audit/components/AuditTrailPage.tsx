import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { PaginationEllipsis } from "@/components/ui/pagination"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSearchParams, useNavigate } from "react-router-dom"
import { AuditTable } from "@/features/audit/components/AuditTable"
import { AuditQuickFilters } from "@/features/audit/components/AuditQuickFilters"
import { useAuditEvents } from "@/features/audit/hooks/useAuditEvents"
import { EMPTY_AUDIT_FILTER_STATE } from "@/features/audit/types"
import type { AuditFilterState } from "@/features/audit/types"
import type { AuditEvent } from "@/features/audit/api/schema"
import { formatDate, formatEventType } from "@/lib/formatters"
import { auditTrailDetail } from "@/router/paths"

const PAGE_SIZES = [10, 25, 50, 100] as const
type PageSize = (typeof PAGE_SIZES)[number]

const MAX_VISIBLE_PAGE_NUMBERS = 5

function buildPageNumbers(
  currentPage: number,
  totalPages: number
): Array<number | "..."> {
  if (totalPages <= MAX_VISIBLE_PAGE_NUMBERS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages = new Set<number>([1, totalPages, currentPage])
  if (currentPage > 1) pages.add(currentPage - 1)
  if (currentPage < totalPages) pages.add(currentPage + 1)
  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: Array<number | "..."> = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...")
    result.push(sorted[i])
  }
  return result
}

function useAuditListParams() {
  const [params, setParams] = useSearchParams()

  function update(
    scalar: Record<string, string | null>,
    arrays: Record<string, string[]> = {}
  ) {
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(scalar)) {
          next.delete(key)
          if (value !== null && value !== "") next.set(key, value)
        }
        for (const [key, values] of Object.entries(arrays)) {
          next.delete(key)
          values.forEach(v => next.append(key, v))
        }
        return next
      },
      { replace: true }
    )
  }

  const page = Math.max(1, Number(params.get("page") ?? "1") || 1)
  const rawPerPage = Number(params.get("per_page") ?? "10")
  const perPage: PageSize = (PAGE_SIZES as readonly number[]).includes(
    rawPerPage
  )
    ? (rawPerPage as PageSize)
    : 10

  const appliedFilters: AuditFilterState = {
    search: params.get("search"),
    event_type: params.getAll("event_type"),
    entity_type: params.get("entity_type"),
    entity_id: params.get("entity_id"),
    actor_id: params.get("actor_id"),
    action_type: params.get("action_type"),
    trigger_source: params.get("trigger_source"),
    sensitive:
      params.get("sensitive") !== null
        ? params.get("sensitive") === "true"
        : null,
    from_dt: params.get("from_dt"),
    to_dt: params.get("to_dt"),
    tenant_id: params.get("tenant_id"),
    result: params.get("result"),
  }

  function setPage(p: number) {
    update({ page: p === 1 ? null : String(p) })
  }

  function setPerPage(size: PageSize) {
    update({ per_page: size === 10 ? null : String(size), page: null })
  }

  function setAppliedFilters(filters: AuditFilterState) {
    update(
      {
        search: filters.search,
        entity_type: filters.entity_type,
        entity_id: filters.entity_id,
        actor_id: filters.actor_id,
        action_type: filters.action_type,
        trigger_source: filters.trigger_source,
        sensitive:
          filters.sensitive !== null ? String(filters.sensitive) : null,
        from_dt: filters.from_dt,
        to_dt: filters.to_dt,
        tenant_id: filters.tenant_id,
        result: filters.result,
        page: null,
      },
      { event_type: filters.event_type }
    )
  }

  return {
    page,
    perPage,
    appliedFilters,
    setPage,
    setPerPage,
    setAppliedFilters,
  }
}

type FilterPillProps = {
  label: string
  onRemove: () => void
  testId: string
}

function FilterPill({ label, onRemove, testId }: FilterPillProps) {
  return (
    <span className="inline-flex items-center gap-0.5 h-[18px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium leading-none shrink-0">
      {label}
      <Button
        type="button"
        variant="ghost"
        data-testid={testId}
        onClick={onRemove}
        className="h-auto p-0 ml-0.5 opacity-80 hover:opacity-100 hover:bg-transparent transition-opacity"
        aria-label={`Remove ${label} filter`}
      >
        <X size={11} strokeWidth={2.5} />
      </Button>
    </span>
  )
}

export default function AuditTrailPage() {
  const { t } = useTranslation("audit")
  const navigate = useNavigate()
  const {
    page,
    perPage,
    appliedFilters,
    setPage,
    setPerPage,
    setAppliedFilters,
  } = useAuditListParams()

  const { data, isLoading, isError } = useAuditEvents({
    page,
    per_page: perPage,
    search: appliedFilters.search ?? undefined,
    event_type:
      appliedFilters.event_type.length > 0
        ? appliedFilters.event_type
        : undefined,
    entity_id: appliedFilters.entity_id ?? undefined,
    actor_id: appliedFilters.actor_id ?? undefined,
    sensitive: appliedFilters.sensitive ?? undefined,
    from_dt: appliedFilters.from_dt ?? undefined,
    to_dt: appliedFilters.to_dt ?? undefined,
    result: appliedFilters.result ?? undefined,
    tenant_id: appliedFilters.tenant_id ?? undefined,
  })

  const activeFilterCount =
    appliedFilters.event_type.length +
    (appliedFilters.actor_id ? 1 : 0) +
    (appliedFilters.from_dt || appliedFilters.to_dt ? 1 : 0) +
    (appliedFilters.sensitive ? 1 : 0)

  const pageNumbers = data ? buildPageNumbers(page, data.total_pages) : []

  function handleRowClick(event: AuditEvent) {
    navigate(auditTrailDetail(event.id))
  }

  return (
    <div className="p-8" data-testid="audit-trail-page">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("page.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("page.subtitle")}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <AuditQuickFilters
        className="mt-6"
        appliedFilters={appliedFilters}
        onFilterChange={update =>
          setAppliedFilters({ ...appliedFilters, ...update })
        }
      />

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground shrink-0">
            {t("page.filters.label")}
          </span>

          {appliedFilters.event_type.map(et => (
            <FilterPill
              key={et}
              label={t("page.filters.eventTypePill", {
                value: formatEventType(et),
              })}
              onRemove={() =>
                setAppliedFilters({
                  ...appliedFilters,
                  event_type: appliedFilters.event_type.filter(e => e !== et),
                })
              }
              testId={`filter-pill-remove-event-type-${et}`}
            />
          ))}

          {(appliedFilters.from_dt || appliedFilters.to_dt) && (
            <FilterPill
              label={t("page.filters.datePill", {
                range: [
                  appliedFilters.from_dt
                    ? formatDate(appliedFilters.from_dt)
                    : null,
                  appliedFilters.from_dt && appliedFilters.to_dt ? "–" : null,
                  appliedFilters.to_dt
                    ? formatDate(appliedFilters.to_dt)
                    : null,
                ]
                  .filter(Boolean)
                  .join(" "),
              })}
              onRemove={() =>
                setAppliedFilters({
                  ...appliedFilters,
                  from_dt: null,
                  to_dt: null,
                })
              }
              testId="filter-pill-remove-date"
            />
          )}

          {appliedFilters.actor_id && (
            <FilterPill
              label={t("page.filters.performedByPill", {
                value: appliedFilters.actor_id.slice(0, 8) + "…",
              })}
              onRemove={() =>
                setAppliedFilters({ ...appliedFilters, actor_id: null })
              }
              testId="filter-pill-remove-performed-by"
            />
          )}

          <Button
            type="button"
            variant="ghost"
            data-testid="filters-clear-all"
            onClick={() => setAppliedFilters(EMPTY_AUDIT_FILTER_STATE)}
            className="h-auto px-2 py-0 text-xs font-normal text-destructive hover:text-destructive hover:bg-transparent hover:opacity-80 transition-opacity"
          >
            {t("page.filters.clearAll")}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4">
        {isError && !isLoading && (
          <p
            className="py-12 text-center text-sm text-muted-foreground"
            data-testid="audit-load-error"
          >
            {t("page.loadError")}
          </p>
        )}
        {!isError && (
          <AuditTable
            events={data?.events ?? []}
            isLoading={isLoading}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      {/* Pagination */}
      {data && (
        <div className="mt-4 flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("page.pagination.rowsPerPage")}
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
              {t("page.pagination.previous")}
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
              onClick={() => setPage(Math.min(data.total_pages, page + 1))}
              disabled={page === data.total_pages}
              className="h-8 gap-1.5 rounded-xl pl-2.5 pr-1.5 text-sm"
            >
              {t("page.pagination.next")}
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
