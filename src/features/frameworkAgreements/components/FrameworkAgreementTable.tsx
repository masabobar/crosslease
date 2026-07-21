import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { TableEmptyState } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { FAListItem } from "@/features/frameworkAgreements/api/schema"
import { FA_STATUS_BADGE_VARIANT } from "@/features/frameworkAgreements/constants"

const COL_AGREEMENT = "flex-1 min-w-[180px]"
const COL_LC = "w-[240px] shrink-0"
const COL_STATUS = "w-[110px] shrink-0"
const COL_VALID_FROM = "w-[110px] shrink-0"
const COL_VALID_UNTIL = "w-[110px] shrink-0"
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
        <div className="shrink-0 w-8" />
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
              <div className="shrink-0 w-8" />
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
        agreements.map(item => (
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
              <Badge variant={FA_STATUS_BADGE_VARIANT[item.status]}>
                {t(`statuses.${item.status}`)}
              </Badge>
            </div>
            <div className={`${COL_VALID_FROM} p-2`}>
              <span className="text-sm text-foreground">{item.valid_from}</span>
            </div>
            <div className={`${COL_VALID_UNTIL} p-2`}>
              <span className="text-sm text-foreground">
                {item.valid_until ?? t("fields.openEnded")}
              </span>
            </div>
            <div className="shrink-0 p-2 flex items-center justify-center">
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </div>
        ))}
    </div>
  )
}

export { FrameworkAgreementTable }
