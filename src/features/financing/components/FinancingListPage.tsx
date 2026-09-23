import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import { FilterCheckboxOption } from "@/components/ui/filter-checkbox-option"
import { PaginationEllipsis } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableEmptyState } from "@/components/ui/empty"
import { buildPageNumbers } from "@/lib/pagination"
import { formatDate } from "@/lib/formatters"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { financingDetail } from "@/router/paths"
import { useFinancings } from "@/features/financing/hooks/useFinancings"
import { financingsExportUrl } from "@/features/financing/api/financingListApi"
import {
  FinancingKindSchema,
  FinancingStatusSchema,
} from "@/features/financing/api/financingListSchema"

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

/**
 * **Financings** — the list.
 *
 * ── WHY THIS IS A LIST AND NOT A LIST PLUS A DETAIL ────────────────────────────────────────────
 * `GET /financings` is the only financing route that is not case-scoped. There is no
 * `GET /financings/{id}`: every other financing endpoint hangs off `/cases/{case_id}/financing/…`,
 * so the case is not a link from the financing — it is the only address the financing has. A row
 * therefore opens the case workspace, where the balance, the pricing, the contracts and the
 * approval conditions already live on their own tabs.
 *
 * ── WHAT THE PROTOTYPE SHOWS THAT THIS DOES NOT ────────────────────────────────────────────────
 * Its table also carries **Payout amount**, **Sollbelastung** and **Habenbelastung**, and an
 * **Outstanding** toggle derived from the last two — none of which are on `FinancingListItem`.
 * Per `api-first.md` §4 they are left out rather than drawn from invented data; the outstanding
 * balance is on the case's own financing overview, which is one click away.
 */
export default function FinancingListPage() {
  const { t } = useTranslation("financing")
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [kind, setKind] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)

  const params = {
    page,
    per_page: PAGE_SIZE,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
    ...(kind ? { kind } : {}),
  }
  const { data, isLoading, isError, error } = useFinancings(params)

  const rows = data?.items ?? []
  const totalPages = Math.max(1, data?.total_pages ?? 1)
  const pageNumbers = data ? buildPageNumbers(page, totalPages) : []
  const hasActiveFilters =
    status !== null || kind !== null || search.trim() !== ""

  // A filter change invalidates the page number — page 3 of the unfiltered list is very likely
  // past the end of the filtered one.
  function applyFilter(setter: (value: string | null) => void) {
    return (value: string | null) => {
      setter(value)
      setPage(1)
    }
  }
  const setStatusFilter = applyFilter(setStatus)
  const setKindFilter = applyFilter(setKind)

  return (
    <div className="p-8 flex flex-col gap-6" data-testid="financing-list-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("list.title")}</h1>
          {/* The prototype says this out loud, and it is the one thing a reader needs to know
              before looking for a create button: a financing is produced by approving a
              refinancing request, never authored here. */}
          <p className="mt-1 text-sm text-muted-foreground">
            {t("list.subtitle")}
          </p>
        </div>

        {/* A plain link, not a fetch: credentials are cookies so the browser is already
            authenticated, and the response is a file for the user rather than data for this code. */}
        {/* NOTE: raw <a> styled as a button — this navigates to a file download, and shadcn's
            Button renders a <button>, which cannot carry an href. */}
        <a
          href={financingsExportUrl(params)}
          className={buttonVariants({ variant: "outline" })}
          data-testid="financing-export"
        >
          <Download size={16} />
          {t("list.export")}
        </a>
      </div>

      <div
        className="flex flex-wrap items-center gap-3"
        data-testid="financing-filters"
      >
        <SearchInput
          value={search}
          className="w-72 max-w-full"
          data-testid="financing-search"
          placeholder={t("list.searchPlaceholder")}
          onChange={event => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />

        <FilterButton
          label={t("list.columns.status")}
          count={status ? 1 : 0}
          data-testid="financing-status-filter"
        >
          {FinancingStatusSchema.options.map(option => (
            <FilterCheckboxOption
              key={option}
              checked={status === option}
              data-testid={`financing-status-option-${option}`}
              onClick={() => setStatusFilter(status === option ? null : option)}
            >
              {t(`statuses.${option}` as "statuses.active")}
            </FilterCheckboxOption>
          ))}
        </FilterButton>

        <FilterButton
          label={t("list.columns.kind")}
          count={kind ? 1 : 0}
          data-testid="financing-kind-filter"
        >
          {FinancingKindSchema.options.map(option => (
            <FilterCheckboxOption
              key={option}
              checked={kind === option}
              data-testid={`financing-kind-option-${option}`}
              onClick={() => setKindFilter(kind === option ? null : option)}
            >
              {t(`kinds.${option}` as "kinds.single")}
            </FilterCheckboxOption>
          ))}
        </FilterButton>

        <span className="ml-auto text-sm text-muted-foreground">
          {t("list.count", { shown: rows.length, total: data?.total ?? 0 })}
        </span>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {isError && (
        <p
          className="text-sm text-destructive"
          data-testid="financing-list-error"
        >
          {resolveApiErrorMessage(error, t)}
        </p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("list.columns.reference")}</TableHead>
                <TableHead>{t("list.columns.leasingCompany")}</TableHead>
                <TableHead>{t("list.columns.rate")}</TableHead>
                <TableHead>{t("list.columns.valueDate")}</TableHead>
                <TableHead>{t("list.columns.loanNumber")}</TableHead>
                <TableHead>{t("list.columns.contracts")}</TableHead>
                <TableHead>{t("list.columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer"
                  data-testid={`financing-row-${row.id}`}
                  onClick={() => navigate(financingDetail(row.case_id))}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      navigate(financingDetail(row.case_id))
                    }
                  }}
                >
                  {/* Reference over kind, as the prototype stacks them — the kind is what says
                      whether one loan covers one contract or a package of them. */}
                  <TableCell>
                    <span className="block font-medium">
                      {row.financing_reference}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {t(`kinds.${row.kind}` as "kinds.single")}
                    </span>
                  </TableCell>
                  <TableCell>{row.lc_partner_name ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">
                    {row.refinancing_rate === null
                      ? "—"
                      : `${row.refinancing_rate} %`}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.value_date === null ? "—" : formatDate(row.value_date)}
                  </TableCell>
                  <TableCell>{row.loan_number ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">
                    {row.contract_count}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {t(`statuses.${row.status}` as "statuses.active")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {rows.length === 0 && (
            <TableEmptyState
              title={t(
                hasActiveFilters ? "list.emptyFiltered" : "list.empty.title"
              )}
              description={t("list.empty.description")}
            />
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div
          className="flex items-center justify-center gap-1"
          data-testid="financing-pager"
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            data-testid="financing-prev"
            onClick={() => setPage(current => Math.max(1, current - 1))}
          >
            <ChevronLeft size={16} />
            {t("list.previous")}
          </Button>
          {pageNumbers.map((item, index) =>
            item === "..." ? (
              <PaginationEllipsis key={`gap-${index}`} />
            ) : (
              <Button
                key={item}
                size="sm"
                variant={item === page ? "outline" : "ghost"}
                data-testid={`financing-page-${item}`}
                onClick={() => setPage(item)}
              >
                {item}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={page === totalPages}
            data-testid="financing-next"
            onClick={() =>
              setPage(current => Math.min(totalPages, current + 1))
            }
          >
            {t("list.next")}
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
