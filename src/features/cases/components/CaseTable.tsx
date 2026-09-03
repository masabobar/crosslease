import { useTranslation } from "react-i18next"
import { TableEmptyState } from "@/components/ui/empty"
import { formatDate } from "@/lib/formatters"
import { CaseStatusBadge } from "@/features/cases/components/CaseStatusBadge"
import { phaseLetter } from "@/features/cases/utils"
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
const COL_ACTIVITY = "w-[180px] shrink-0"
const ROW_H = "min-h-[60px]"
const SKELETON_COUNT = 5

const HEADER_COLUMNS = [
  { width: COL_CASE, labelKey: "list.table.columns.case" },
  { width: COL_COMPANY, labelKey: "list.table.columns.leasingCompany" },
  { width: COL_CONTRACTS, labelKey: "list.table.columns.contracts" },
  { width: COL_STATUS, labelKey: "list.table.columns.status" },
  { width: COL_PHASE, labelKey: "list.table.columns.phase" },
  { width: COL_ACTIVITY, labelKey: "list.table.columns.lastActivity" },
] as const

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

              {/* "Phase A" over "Step 1/5", where the fraction is the phase's ordinal — see
                  api/schema.ts. `title` carries the phase's actual name, which the design has no
                  room for but which is the only thing here that says what the phase IS. */}
              <div className={`${COL_PHASE} px-3 py-2`}>
                {phaseLetter(row.phase_position) === null ? (
                  <span className="text-sm text-muted-foreground">—</span>
                ) : (
                  <div title={row.phase_name ?? undefined}>
                    <p className="text-sm text-foreground leading-tight">
                      {t("list.table.phaseLabel", {
                        letter: phaseLetter(row.phase_position),
                      })}
                    </p>
                    {row.phase_count ? (
                      <p className="text-xs text-muted-foreground leading-tight">
                        {t("list.table.stepLabel", {
                          position: row.phase_position,
                          total: row.phase_count,
                        })}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className={`${COL_ACTIVITY} px-3 py-2`}>
                {row.last_activity_at ? (
                  <>
                    <p className="text-sm text-foreground leading-tight">
                      {formatDate(row.last_activity_at)}
                    </p>
                    {row.last_activity_by && (
                      <p className="text-xs text-muted-foreground truncate leading-tight">
                        {row.last_activity_by}
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
