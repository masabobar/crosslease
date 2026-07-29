import { ChevronRight } from "lucide-react"
import { TableEmptyState } from "@/components/ui/empty"
import { useTranslation } from "react-i18next"
import {
  formatEventType,
  formatActionType,
  formatDateTime,
} from "@/lib/formatters"
import {
  deriveAuditResult,
  type AuditEventListItem,
} from "@/features/audit/api/schema"
import { AuditResultBadge } from "@/features/audit/components/AuditResultBadge"
import { EntityTypeBadge } from "@/features/audit/components/EntityTypeBadge"

const COL_TIMESTAMP = "w-[150px] shrink-0"
const COL_ENTITY = "flex-1 min-w-[140px]"
const COL_ENTITY_TYPE = "w-[150px] shrink-0"
const COL_EVENT = "w-[210px] shrink-0"
const COL_ACTOR = "w-[230px] shrink-0"
const COL_RESULT = "w-[90px] shrink-0"
const COL_FLAG = "w-[90px] shrink-0"
const COL_CHEVRON = "w-[32px] shrink-0"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

function SensitiveBadge() {
  const { t } = useTranslation("audit")
  return (
    <span className="inline-flex items-center justify-center rounded-full border border-destructive/50 bg-destructive/10 px-1.5 py-0.5 text-xs font-medium leading-4 whitespace-nowrap text-destructive">
      {t("flag.sensitive")}
    </span>
  )
}

type AuditTableProps = {
  events: AuditEventListItem[]
  isLoading: boolean
  onRowClick: (event: AuditEventListItem) => void
  hasActiveFilters?: boolean
}

export function AuditTable({
  events,
  isLoading,
  onRowClick,
  hasActiveFilters = false,
}: AuditTableProps) {
  const { t } = useTranslation("audit")

  return (
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="audit-table"
    >
      {/* NOTE: raw flex div-grid instead of shadcn Table/TableRow/TableCell — this
          is a pre-existing, codebase-wide convention shared by every table component
          (UserTable, TenantTable, PartnerTable, FrameworkAgreementTable,
          ProductTemplateTable, DuplicateQueueTable), not something introduced here.
          Converting only this table would diverge from the established pattern and
          risks breaking the fixed column widths / sticky-header behavior without a
          browser to verify against; a full migration is a separate, cross-feature
          effort. See UserTable.tsx for the identical precedent. */}
      {/* Header */}
      <div className="flex border-b border-border h-10 items-center">
        <div
          className={`${COL_TIMESTAMP} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.timestamp")}
        </div>
        <div
          className={`${COL_ENTITY} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.entity")}
        </div>
        <div
          className={`${COL_ENTITY_TYPE} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.entityType")}
        </div>
        <div
          className={`${COL_EVENT} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.eventType")}
        </div>
        <div
          className={`${COL_ACTOR} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.actor")}
        </div>
        <div
          className={`${COL_RESULT} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.result")}
        </div>
        <div className={`${COL_FLAG} px-2 text-sm font-medium text-foreground`}>
          {t("table.columns.flag")}
        </div>
        <div className={COL_CHEVRON} />
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div data-testid="audit-table-loading">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div
              key={i}
              className={`flex border-b border-border ${ROW_H} items-center`}
            >
              <div className={`${COL_TIMESTAMP} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-36" />
              </div>
              <div className={`${COL_ENTITY} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-28" />
              </div>
              <div className={`${COL_ENTITY_TYPE} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-16" />
              </div>
              <div className={`${COL_EVENT} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-32" />
              </div>
              <div className={`${COL_ACTOR} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-24" />
              </div>
              <div className={`${COL_RESULT} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-14" />
              </div>
              <div className={`${COL_FLAG} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-12" />
              </div>
              <div className={COL_CHEVRON} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading &&
        events.length === 0 &&
        (hasActiveFilters ? (
          <TableEmptyState
            title={t("table.emptyFiltered.title")}
            description={t("table.emptyFiltered.description")}
          />
        ) : (
          <TableEmptyState
            title={t("table.emptyState.title")}
            description={t("table.emptyState.description")}
          />
        ))}

      {/* Data rows */}
      {!isLoading &&
        events.map(event => (
          // NOTE: raw <div role="button"> — full-row click target for a row rendered
          // as a flex div (see NOTE above on the div-grid table convention); a native
          // shadcn Button/Table primitive can't wrap an entire row of nested cells,
          // so role="button" + tabIndex + onKeyDown provides the equivalent keyboard
          // and assistive-tech affordance.
          <div
            key={event.id}
            role="button"
            tabIndex={0}
            data-testid={`audit-row-${event.id}`}
            className={`flex border-b border-border ${ROW_H} items-center hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            onClick={() => onRowClick(event)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onRowClick(event)
              }
            }}
          >
            <div className={`${COL_TIMESTAMP} p-2`}>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDateTime(event.recorded_at)}
              </span>
            </div>

            <div className={`${COL_ENTITY} p-2 flex flex-col gap-px`}>
              <span className="text-sm text-foreground truncate">
                {event.entity_display ?? "—"}
              </span>
              {event.entity_id && (
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {event.entity_id}
                </span>
              )}
            </div>

            <div className={`${COL_ENTITY_TYPE} p-2 overflow-hidden`}>
              <EntityTypeBadge entityType={event.entity_type} />
            </div>

            <div className={`${COL_EVENT} p-2`}>
              <span
                className="text-sm text-foreground truncate block"
                title={event.event_type}
              >
                {formatEventType(event.event_type)}
              </span>
            </div>

            <div className={`${COL_ACTOR} p-2 flex flex-col gap-px`}>
              <span className="text-sm text-foreground truncate">
                {event.actor_display ?? event.actor_id ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {formatActionType(event.actor_type)}
              </span>
            </div>

            <div className={`${COL_RESULT} p-2`}>
              <AuditResultBadge
                result={deriveAuditResult(event.event_type, event.action_type)}
              />
            </div>

            <div className={`${COL_FLAG} p-2`}>
              {event.sensitive ? (
                <SensitiveBadge />
              ) : (
                <span className="text-sm text-muted-foreground">–</span>
              )}
            </div>

            <div className={`${COL_CHEVRON} flex items-center justify-center`}>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </div>
        ))}
    </div>
  )
}
