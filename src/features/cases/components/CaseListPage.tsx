import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, SquarePen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import { FilterCheckboxOption } from "@/components/ui/filter-checkbox-option"
import { PaginationEllipsis } from "@/components/ui/pagination"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { buildPageNumbers } from "@/lib/pagination"
import { caseDetail } from "@/router/paths"
import { CaseTable } from "@/features/cases/components/CaseTable"
import { StartCaseDialog } from "@/features/cases/components/StartCaseDialog"
import { useCases } from "@/features/cases/hooks/useCases"
import { CaseTypeSchema } from "@/features/cases/api/schema"
import {
  CASE_DISPLAY_STATUS_BADGE_VARIANT,
  CASE_WRITE_ALLOWED_ROLES,
} from "@/features/cases/types"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"

const PAGE_SIZE = 10

// `display_status` is a plain string on the wire — the backend widens the set independently, so
// there is no enum to enumerate. The badge-variant map is this codebase's existing list of the
// statuses the UI knows about, so the filter offers exactly those. A status the backend adds shows
// up in the table (with the neutral badge) before it becomes filterable, which is the right way
// round: the row is never hidden, only the shortcut to it is missing until the map is updated.
const KNOWN_DISPLAY_STATUSES = Object.keys(CASE_DISPLAY_STATUS_BADGE_VARIANT)

/**
 * The Cases list, rebuilt to the Figma frame (`CREATE NEW.pdf`, frame 1).
 *
 * The frame's toolbar is Search · Case type · Status, and its pager is
 * "‹ Previous 1 2 3 … Next ›" — replacing the four scope pills (`All / Assigned to me /
 * Unassigned / Unclaimed`) that were here before. Those pills mapped to the backend's `mine` /
 * `unassigned` / `unclaimed` params, which the design does not surface at all; they are dropped
 * rather than kept alongside, because a toolbar that is the design plus extras is not the design.
 *
 * ── SEARCH IS PAGE-LOCAL, AND THAT IS A GAP ────────────────────────────────────────────────────
 * `GET /cases` has no search or query parameter — its only filters are `case_type`, `status` and
 * the three scope booleans. So the search box filters **the rows already on screen**, not the whole
 * list, and the row count next to it says so. It is wired this way rather than omitted because the
 * control is in the design and a page-local filter does something real; the day the backend gains a
 * `search` param this moves into the query and the caveat goes away.
 *
 * Case type, status and the pager are all backed by real query parameters (`case_type`, `status`,
 * `limit`, `offset`, and `total` in the response).
 */
export default function CaseListPage() {
  const { t } = useTranslation("cases")
  const navigate = useNavigate()
  const [startOpen, setStartOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [caseType, setCaseType] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const { data: currentUser } = useCurrentUser()
  const canStartCase =
    !!currentUser && CASE_WRITE_ALLOWED_ROLES.includes(currentUser.role)

  const { data, isLoading, isError, error } = useCases({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    ...(caseType ? { case_type: caseType } : {}),
    ...(status ? { status } : {}),
  })

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageNumbers = data ? buildPageNumbers(page, totalPages) : []

  // Page-local only — see the note above. Matched against the two identifying columns the reader
  // would actually type into a search box.
  const query = search.trim().toLowerCase()
  const rows = (data?.items ?? []).filter(
    row =>
      query === "" ||
      row.case_reference.toLowerCase().includes(query) ||
      (row.lc_partner_name ?? "").toLowerCase().includes(query)
  )

  const hasActiveFilters = caseType !== null || status !== null || query !== ""

  // A filter change invalidates the current page number — page 3 of the unfiltered list is very
  // likely past the end of the filtered one.
  function applyFilter(setter: (value: string | null) => void) {
    return (value: string | null) => {
      setter(value)
      setPage(1)
    }
  }

  const setCaseTypeFilter = applyFilter(setCaseType)
  const setStatusFilter = applyFilter(setStatus)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("list.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("list.subtitle")}
          </p>
        </div>
        {canStartCase && (
          <Button
            data-testid="start-case-button"
            onClick={() => setStartOpen(true)}
          >
            <SquarePen size={16} />
            {t("start.button")}
          </Button>
        )}
      </div>

      {startOpen && <StartCaseDialog onOpenChange={setStartOpen} />}

      <div
        className="mt-6 flex flex-wrap items-center gap-3"
        data-testid="case-list-filters"
      >
        <SearchInput
          className="w-[280px]"
          placeholder={t("list.searchPlaceholder")}
          value={search}
          data-testid="case-search-input"
          onChange={event => setSearch(event.target.value)}
        />

        <FilterButton
          label={t("list.table.columns.caseType")}
          count={caseType ? 1 : 0}
          data-testid="case-type-filter"
        >
          {CaseTypeSchema.options.map(option => (
            <FilterCheckboxOption
              key={option}
              checked={caseType === option}
              data-testid={`case-type-option-${option}`}
              onClick={() =>
                setCaseTypeFilter(caseType === option ? null : option)
              }
            >
              {t(`caseTypes.${option}`, { defaultValue: option })}
            </FilterCheckboxOption>
          ))}
        </FilterButton>

        <FilterButton
          label={t("list.table.columns.status")}
          count={status ? 1 : 0}
          data-testid="case-status-filter"
        >
          {KNOWN_DISPLAY_STATUSES.map(option => (
            <FilterCheckboxOption
              key={option}
              checked={status === option}
              data-testid={`case-status-option-${option}`}
              onClick={() => setStatusFilter(status === option ? null : option)}
            >
              {t(`displayStatuses.${option}`, { defaultValue: option })}
            </FilterCheckboxOption>
          ))}
        </FilterButton>

        {/* The count is here because the search above it is page-local: it tells the reader how
            many of the loaded rows they are looking at, which is the honest framing. */}
        {!isLoading && !isError && (
          <span
            className="text-sm text-muted-foreground"
            data-testid="case-list-count"
          >
            {t("list.rowCount", { shown: rows.length, total })}
          </span>
        )}
      </div>

      <div className="mt-4">
        {isError && !isLoading && (
          <p
            data-testid="case-list-error"
            className="text-sm text-destructive py-8 text-center"
          >
            {resolveApiErrorMessage(error, t)}
          </p>
        )}
        {!isError && (
          <CaseTable
            rows={rows}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            onRowClick={id => navigate(caseDetail(id))}
          />
        )}
      </div>

      {!isError && totalPages > 1 && (
        <div
          className="mt-4 flex items-center justify-end gap-1"
          data-testid="case-list-pagination"
        >
          <Button
            variant="ghost"
            size="sm"
            data-testid="pagination-previous"
            disabled={page === 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            <ChevronLeft size={16} />
            {t("list.pagination.previous")}
          </Button>
          {pageNumbers.map((item, index) =>
            item === "..." ? (
              <PaginationEllipsis key={`ellipsis-${index}`} />
            ) : (
              <Button
                key={item}
                variant={item === page ? "outline" : "ghost"}
                size="sm"
                data-testid={`pagination-page-${item}`}
                onClick={() => setPage(item)}
              >
                {item}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            size="sm"
            data-testid="pagination-next"
            disabled={page === totalPages}
            onClick={() => setPage(Math.min(totalPages, page + 1))}
          >
            {t("list.pagination.next")}
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
