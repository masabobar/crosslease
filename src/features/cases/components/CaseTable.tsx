import { useTranslation } from "react-i18next"
import { TableEmptyState } from "@/components/ui/empty"
import { formatDate } from "@/lib/formatters"
import { CaseStatusBadge } from "@/features/cases/components/CaseStatusBadge"
import { daysUntilDate, rateDueTone } from "@/features/cases/utils"
import { cn } from "@/lib/utils"
import type { CaseListItem } from "@/features/cases/api/schema"

/**
 * The Cases list table, rebuilt to the Figma frame (`CREATE NEW.pdf`, frame 1).
 *
 * Six columns, each a two-line cell where the design has one: the case reference over its type,
 * the phase over its step fraction, the activity date over the person. That stacking is why this
 * stays a div grid rather than the shadcn `Table` primitive — matching the sibling list tables
 * (ProductTemplateTable, WorkflowTaskCatalogTable).
 *
 * **Four columns render an em-dash against the real API and that is deliberate.** Only the case
 * and status columns are backed by `CaseListItem` as the contract declares it; the leasing company,
 * contract count, phase and last activity are documented backend gaps carried as optional fields
 * (see `api/schema.ts`). An em-dash makes the gap visible; inventing a value would hide it.
 */
const COL_CASE = "flex-1 min-w-[170px]"
const COL_COMPANY = "w-[220px] shrink-0"
const COL_CONTRACTS = "w-[100px] shrink-0"
const COL_STATUS = "w-[170px] shrink-0"
const COL_PHASE = "w-[130px] shrink-0"
const COL_ORIGIN = "w-[190px] shrink-0"
const COL_WAITING = "w-[170px] shrink-0"
const COL_RATE_DUE = "w-[150px] shrink-0"
const COL_ACTIVITY = "w-[180px] shrink-0"
const ROW_H = "min-h-[60px]"
const SKELETON_COUNT = 5

const HEADER_COLUMNS = [
  { width: COL_CASE, labelKey: "list.table.columns.case" },
  { width: COL_COMPANY, labelKey: "list.table.columns.leasingCompany" },
  { width: COL_CONTRACTS, labelKey: "list.table.columns.contracts" },
  { width: COL_STATUS, labelKey: "list.table.columns.status" },
  { width: COL_ORIGIN, labelKey: "list.table.columns.initiatedBy" },
  { width: COL_PHASE, labelKey: "list.table.columns.phase" },
  { width: COL_WAITING, labelKey: "list.table.columns.waitingOn" },
  { width: COL_RATE_DUE, labelKey: "list.table.columns.rateDue" },
  { width: COL_ACTIVITY, labelKey: "list.table.columns.lastActivity" },
] as const

/** "3 days ago" / "today" / "in 5 days" — the dummy's own wording under the date. */
function useRateDueNote() {
  const { t } = useTranslation("cases")
  return (dueDate: string): string => {
    const days = daysUntilDate(dueDate)
    if (days === null) return ""
    if (days < 0)
      return t("list.table.rateDueOverdue", { count: Math.abs(days) })
    if (days === 0) return t("list.table.rateDueToday")
    return t("list.table.rateDueIn", { count: days })
  }
}

type Props = {
  rows: CaseListItem[]
  isLoading: boolean
  hasActiveFilters: boolean
  onRowClick: (caseId: string) => void
}

export function CaseTable({
  rows,
  isLoading,
  hasActiveFilters,
  onRowClick,
}: Props) {
  const { t } = useTranslation("cases")
  const rateDueNote = useRateDueNote()

  return (
    // The six columns do not compress below roughly 1000px, so the table scrolls inside its own
    // container rather than forcing the page to scroll sideways.
    <div className="w-full overflow-x-auto" data-testid="case-table-scroll">
      <div
        className="min-w-[1000px] border border-border rounded-[10px] overflow-hidden bg-background"
        data-testid="case-table"
      >
        <div className="flex border-b border-border h-11 items-center bg-muted/30">
          {HEADER_COLUMNS.map(col => (
            <div
              key={col.labelKey}
              className={`${col.width} text-sm font-medium text-foreground px-3`}
            >
              {t(col.labelKey)}
            </div>
          ))}
        </div>

        {isLoading && (
          <div data-testid="case-table-loading">
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <div
                key={i}
                className={`flex border-b border-border ${ROW_H} items-center`}
              >
                {HEADER_COLUMNS.map(col => (
                  <div key={col.labelKey} className={`${col.width} px-3 py-2`}>
                    <div className="bg-muted rounded h-4 animate-pulse w-20" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {!isLoading &&
          rows.length === 0 &&
          (hasActiveFilters ? (
            <TableEmptyState
              title={t("list.emptyFiltered.title")}
              description={t("list.emptyFiltered.description")}
            />
          ) : (
            <TableEmptyState
              title={t("list.emptyState.title")}
              description={t("list.emptyState.description")}
            />
          ))}

        {!isLoading &&
          rows.map(row => (
            <div
              key={row.id}
              data-testid={`case-row-${row.id}`}
              className={`flex border-b border-border last:border-b-0 ${ROW_H} items-center hover:bg-muted/40 transition-colors cursor-pointer`}
              onClick={() => onRowClick(row.id)}
            >
              {/* Reference over its case type — the design's primary identifier cell. */}
              <div className={`${COL_CASE} px-3 py-2`}>
                <p className="text-sm font-medium truncate text-foreground leading-tight">
                  {row.case_reference}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {t(
                    `caseTypes.${row.case_type}` as "caseTypes.refinancing_request",
                    { defaultValue: row.case_type }
                  )}
                </p>
              </div>

              <div className={`${COL_COMPANY} px-3 py-2`}>
                <span className="text-sm text-foreground truncate block">
                  {row.lc_partner_name ?? "—"}
                </span>
              </div>

              <div className={`${COL_CONTRACTS} px-3 py-2`}>
                <span className="text-sm text-foreground tabular-nums">
                  {row.contract_count ?? "—"}
                </span>
              </div>

              <div className={`${COL_STATUS} px-3 py-2`}>
                <CaseStatusBadge status={row.display_status} />
              </div>

              {/* "Initiated by" — who started it over how it arrived. The dummy prints "the bank"
                  for anything the bank raised and "<company>, through the portal" for a portal
                  case, which is the distinction that matters on this list. */}
              <div className={`${COL_ORIGIN} px-3 py-2`}>
                <p className="text-sm text-foreground leading-tight truncate">
                  {row.created_by}
                </p>
                <p className="text-xs text-muted-foreground leading-tight truncate">
                  {row.origin === "portal"
                    ? t("list.table.originPortal", {
                        company: row.lc_partner_name ?? "",
                      })
                    : t("list.table.originBank")}
                </p>
              </div>

              {/* "Phase B" over "Step 9/45". The fraction used to be the phase's ordinal (A→1/5)
                  off the retired `phase_position` / `phase_count` pair; `step_order` is the step's
                  position in the whole catalogue, which says how far the case has actually got.
                  The denominator is not on the wire — the dummy reads it off the catalogue per case
                  type — so the numerator stands alone until it lands. */}
              <div className={`${COL_PHASE} px-3 py-2`}>
                {row.phase === null || row.phase === undefined ? (
                  <span className="text-sm text-muted-foreground">—</span>
                ) : (
                  <div>
                    <p className="text-sm text-foreground leading-tight">
                      {t("list.table.phaseLabel", { letter: row.phase })}
                    </p>
                    {row.step_order !== null &&
                      row.step_order !== undefined && (
                        <p className="text-xs text-muted-foreground leading-tight">
                          {t("list.table.stepLabel", {
                            position: row.step_order,
                          })}
                        </p>
                      )}
                  </div>
                )}
              </div>

              {/* "Waiting on" — the role group whose turn it is. A finished case waits on nobody,
                  and the wire says so by sending none rather than by sending a role. */}
              <div className={`${COL_WAITING} px-3 py-2`}>
                {(row.waiting_on_roles ?? []).length === 0 ? (
                  <span className="text-sm text-muted-foreground">—</span>
                ) : (
                  <p className="text-sm text-foreground leading-tight">
                    {(row.waiting_on_roles ?? [])
                      .map(role =>
                        t(
                          `list.table.roles.${role}` as "list.table.roles.front_office",
                          { defaultValue: role }
                        )
                      )
                      .join(t("list.table.rolesOr"))}
                  </p>
                )}
              </div>

              {/* "Refinancing rate due" — the date over how close it is, coloured once it is near
                  or past. A rate quote that has run out is the single thing on this list that
                  makes a case urgent, so it is the one cell allowed to use colour. */}
              <div className={`${COL_RATE_DUE} px-3 py-2`}>
                {row.rate_due_date ? (
                  <>
                    <p className="text-sm text-foreground leading-tight">
                      {formatDate(row.rate_due_date)}
                    </p>
                    <p
                      className={cn(
                        "text-xs leading-tight",
                        rateDueTone(row.rate_due_date)
                      )}
                    >
                      {rateDueNote(row.rate_due_date)}
                    </p>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>

              <div className={`${COL_ACTIVITY} px-3 py-2`}>
                {row.last_activity_at ? (
                  <>
                    <p className="text-sm text-foreground leading-tight">
                      {formatDate(row.last_activity_at)}
                    </p>
                    {row.last_activity_by_name && (
                      <p className="text-xs text-muted-foreground truncate leading-tight">
                        {row.last_activity_by_name}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
