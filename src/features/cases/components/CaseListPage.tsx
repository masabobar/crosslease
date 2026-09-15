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
import { CaseOriginSchema, CaseTypeSchema } from "@/features/cases/api/schema"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useFrameworkAgreementLcPartners } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementLcPartners"
import {
  CASE_DISPLAY_STATUS_BADGE_VARIANT,
  CASE_START_ALLOWED_ROLES,
} from "@/features/cases/types"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useUsers } from "@/features/users/hooks/useUsers"
import { UserStatusSchema } from "@/features/users/api/schema"

const PAGE_SIZE = 10

// Enough to cover a bank's own front/back office without turning the menu into a scroll list.
const ASSIGNEE_OPTION_LIMIT = 50
const SEARCH_DEBOUNCE_MS = 300

/**
 * The role groups a step can wait on — the catalogue's `TaskResponsibleRole`, which is what
 * `waiting_on_roles` carries on each row and what `waiting_on_role` filters by.
 *
 * Listed rather than read off a schema because the value is a plain string on the wire: the
 * contract declares `waiting_on_roles` as `string[]`, so there is no enum to enumerate.
 */
const WAITING_ON_ROLES = [
  "front_office",
  "back_office_risk",
  "compliance",
  "legal",
  "treasury",
  "support",
  "system",
] as const

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
 * ── EVERY FILTER REACHES THE SERVER ────────────────────────────────────────────────────────────
 * Search used to be page-local: `GET /cases` had no query parameter, so the box filtered the rows
 * already on screen and the count beside it said so. The 14 Sep contract added `search`, `origin`,
 * `lc_partner_id`, `waiting_on_role` and `assignee_id`, so the caveat is gone — every control here
 * narrows the whole list, and there is deliberately **no** second filter over the returned rows: a
 * page-local pass on top of a server-side one would silently drop rows the backend matched on
 * purpose.
 */
export default function CaseListPage() {
  const { t } = useTranslation("cases")
  const navigate = useNavigate()
  const [startOpen, setStartOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [caseType, setCaseType] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  // The three the 14 Sep contract added query parameters for. The final dummy's toolbar carries
  // them beside Status, and all three filter the whole list rather than the page.
  const [origin, setOrigin] = useState<string | null>(null)
  const [lcPartnerId, setLcPartnerId] = useState<string | null>(null)
  const [waitingOnRole, setWaitingOnRole] = useState<string | null>(null)
  // The dummy's fifth control. `assignee_id` takes a user id, not a role, so unlike its four
  // neighbours the options cannot come from an enum — they are the tenant's own people.
  const [assigneeId, setAssigneeId] = useState<string | null>(null)

  const { data: currentUser } = useCurrentUser()
  const lcPartners = useFrameworkAgreementLcPartners()
  // Only people who can actually hold a case. A suspended or invited account would filter the list
  // down to rows nobody can be working, which is a filter that can only ever return nothing.
  const assignableUsers = useUsers({
    status: [UserStatusSchema.enum.active],
    per_page: ASSIGNEE_OPTION_LIMIT,
  })
  const canStartCase =
    !!currentUser && CASE_START_ALLOWED_ROLES.includes(currentUser.role)

  // Debounced so typing a reference costs one request after the pause rather than one per
  // character, now that the search reaches the server.
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)

  const { data, isLoading, isError, error } = useCases({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    ...(caseType ? { case_type: caseType } : {}),
    ...(status ? { status } : {}),
    ...(origin ? { origin } : {}),
    ...(lcPartnerId ? { lc_partner_id: lcPartnerId } : {}),
    ...(waitingOnRole ? { waiting_on_role: waitingOnRole } : {}),
    ...(assigneeId ? { assignee_id: assigneeId } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  })

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageNumbers = data ? buildPageNumbers(page, totalPages) : []

  // Whatever the server returned for the query above — no second filter here. A page-local filter
  // on top of a server-side one would silently drop rows the backend deliberately matched.
  const rows = data?.items ?? []

  const hasActiveFilters =
    caseType !== null ||
    status !== null ||
    origin !== null ||
    lcPartnerId !== null ||
    waitingOnRole !== null ||
    assigneeId !== null ||
    search.trim() !== ""

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
  const setAssigneeFilter = applyFilter(setAssigneeId)
  const setOriginFilter = applyFilter(setOrigin)
  const setLcPartnerFilter = applyFilter(setLcPartnerId)
  const setWaitingOnFilter = applyFilter(setWaitingOnRole)

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

        {/* Initiated by — how the case arrived. `CaseOriginSchema.options` rather than a hand-kept
            list, so a value the backend adds to the enum shows up here without a second edit. */}
        <FilterButton
          label={t("list.table.columns.initiatedBy")}
          count={origin ? 1 : 0}
          data-testid="case-origin-filter"
        >
          {CaseOriginSchema.options.map(option => (
            <FilterCheckboxOption
              key={option}
              checked={origin === option}
              data-testid={`case-origin-option-${option}`}
              onClick={() => setOriginFilter(origin === option ? null : option)}
            >
              {t(
                `list.filters.origins.${option}` as "list.filters.origins.wizard",
                {
                  defaultValue: option,
                }
              )}
            </FilterCheckboxOption>
          ))}
        </FilterButton>

        {/* Leasing company — the eligible list the wizard's own picker reads, so the two cannot
            offer different companies. */}
        <FilterButton
          label={t("list.table.columns.leasingCompany")}
          count={lcPartnerId ? 1 : 0}
          data-testid="case-lc-filter"
        >
          {(lcPartners.data?.items ?? []).map(partner => (
            <FilterCheckboxOption
              key={partner.id}
              checked={lcPartnerId === partner.id}
              data-testid={`case-lc-option-${partner.id}`}
              onClick={() =>
                setLcPartnerFilter(
                  lcPartnerId === partner.id ? null : partner.id
                )
              }
            >
              {partner.legal_name}
            </FilterCheckboxOption>
          ))}
        </FilterButton>

        {/* Waiting on — the role group whose turn it is. The values are the catalogue's own
            `TaskResponsibleRole`, which is what `waiting_on_roles` carries on each row. */}
        <FilterButton
          label={t("list.table.columns.waitingOn")}
          count={waitingOnRole ? 1 : 0}
          data-testid="case-waiting-filter"
        >
          {WAITING_ON_ROLES.map(option => (
            <FilterCheckboxOption
              key={option}
              checked={waitingOnRole === option}
              data-testid={`case-waiting-option-${option}`}
              onClick={() =>
                setWaitingOnFilter(waitingOnRole === option ? null : option)
              }
            >
              {t(
                `list.table.roles.${option}` as "list.table.roles.front_office",
                {
                  defaultValue: option,
                }
              )}
            </FilterCheckboxOption>
          ))}
        </FilterButton>

        {/* Assignee — who personally holds the case, as against `Waiting on`, which is the role
            group whose turn it is. They answer different questions and the dummy carries both. */}
        <FilterButton
          label={t("list.filters.assignee")}
          count={assigneeId ? 1 : 0}
          data-testid="case-assignee-filter"
        >
          {(assignableUsers.data?.users ?? []).map(user => (
            <FilterCheckboxOption
              key={user.id}
              checked={assigneeId === user.id}
              data-testid={`case-assignee-option-${user.id}`}
              onClick={() =>
                setAssigneeFilter(assigneeId === user.id ? null : user.id)
              }
            >
              {user.first_name} {user.last_name}
            </FilterCheckboxOption>
          ))}
        </FilterButton>

        {/* Now that every control narrows the whole list, this is "N of M", both from the server. */}
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
