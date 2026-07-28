import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { TableEmptyState } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { FAListItem } from "@/features/frameworkAgreements/api/schema"
import { FA_STATUS_BADGE_VARIANT } from "@/features/frameworkAgreements/constants"
import { getFrameworkAgreementDisplayStatus } from "@/features/frameworkAgreements/utils"

// Widths mirror the FA list design (Figma node 1:9673, table frame 1:9695): Agreement
// 200, Leasing company 284, Status 130, Valid from 120, Valid until 120, row action 32.
// The design's Utilization (120) and Limit breach (130) columns are deliberately absent —
// utilization_pct and limit_breach are on FAListItem but the BE returns null for both
// until Limit Management ships (see Q-022).
// Leasing company is the flexible column so the page's full-width layout has somewhere to
// put slack: agreement codes are effectively fixed-length while partner names are not.
// Same one-flexible-text-column shape as AuditTable and DuplicateQueueTable.
const COL_AGREEMENT = "w-[200px] shrink-0"
const COL_LC = "flex-1 min-w-[284px]"
const COL_STATUS = "w-[130px] shrink-0"
const COL_VALID_FROM = "w-[120px] shrink-0"
const COL_VALID_UNTIL = "w-[120px] shrink-0"
const COL_ACTION = "w-[32px] shrink-0"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

type Props = {
  agreements: FAListItem[]
  isLoading: boolean
  hasActiveFilters: boolean
  onRowClick?: (agreement: FAListItem) => void
  onCreateAgreement?: () => void
}

function FrameworkAgreementTable({
  agreements,
  isLoading,
  hasActiveFilters,
  onRowClick,
  onCreateAgreement,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")

  return (
    // NOTE: raw <div> rows instead of shadcn Table/TableRow/TableCell — fixed-width
    // flex columns (COL_*) drive alignment with the loading-skeleton row shape, which
    // the semantic <table> layout model doesn't support as directly; same div-based
    // flex-table pattern used by AuditTable and DuplicateQueueTable in this codebase.
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="framework-agreement-table"
    >
      <div className="flex border-b border-border h-10 items-center">
        <div
          className={`${COL_AGREEMENT} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.agreement")}
        </div>
        <div className={`${COL_LC} text-sm font-medium text-foreground px-2`}>
          {t("list.table.columns.leasingCompany")}
        </div>
        <div
          className={`${COL_STATUS} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.status")}
        </div>
        <div
          className={`${COL_VALID_FROM} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.validFrom")}
        </div>
        <div
          className={`${COL_VALID_UNTIL} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.validUntil")}
        </div>
        <div className={COL_ACTION} />
      </div>

      {isLoading && (
        <div data-testid="framework-agreement-table-loading">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div
              key={i}
              className={`flex border-b border-border ${ROW_H} items-center`}
            >
              <div className={`${COL_AGREEMENT} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-32" />
              </div>
              <div className={`${COL_LC} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-28" />
              </div>
              <div className={`${COL_STATUS} p-2`}>
                <div className="bg-muted rounded-full h-5 animate-pulse w-16" />
              </div>
              <div className={`${COL_VALID_FROM} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-16" />
              </div>
              <div className={`${COL_VALID_UNTIL} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-16" />
              </div>
              <div className={COL_ACTION} />
            </div>
          ))}
        </div>
      )}

      {!isLoading &&
        agreements.length === 0 &&
        (hasActiveFilters ? (
          <TableEmptyState
            title={t("list.emptyFiltered.title")}
            description={t("list.emptyFiltered.description")}
          />
        ) : (
          <TableEmptyState
            title={t("list.emptyState.title")}
            description={t("list.emptyState.description")}
            action={
              onCreateAgreement && (
                <Button
                  onClick={onCreateAgreement}
                  className="h-9 rounded-xl px-4 gap-1.5"
                >
                  {t("list.createButton")}
                </Button>
              )
            }
          />
        ))}

      {!isLoading &&
        agreements.map(item => {
          const displayStatus = getFrameworkAgreementDisplayStatus(
            item.status,
            item.is_expired
          )
          return (
            <div
              key={item.id}
              data-testid={`framework-agreement-row-${item.id}`}
              onClick={() => onRowClick?.(item)}
              className={`flex border-b border-border ${ROW_H} items-center hover:bg-muted/40 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
            >
              <div className={`${COL_AGREEMENT} p-2`}>
                <p className="text-sm font-medium truncate text-foreground leading-tight">
                  {item.agreement_name}
                </p>
              </div>
              <div className={`${COL_LC} p-2`}>
                <span className="text-sm text-foreground truncate">
                  {item.lc_partner_name ?? "—"}
                </span>
              </div>
              <div className={`${COL_STATUS} p-2`}>
                <Badge variant={FA_STATUS_BADGE_VARIANT[displayStatus]}>
                  {t(`statuses.${displayStatus}`)}
                </Badge>
              </div>
              <div className={`${COL_VALID_FROM} p-2`}>
                <span className="text-sm text-foreground">
                  {item.valid_from}
                </span>
              </div>
              <div className={`${COL_VALID_UNTIL} p-2`}>
                <span className="text-sm text-foreground">
                  {item.valid_until ?? t("fields.openEnded")}
                </span>
              </div>
              <div
                className={`${COL_ACTION} p-2 flex items-center justify-center`}
              >
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </div>
          )
        })}
    </div>
  )
}

export { FrameworkAgreementTable }
