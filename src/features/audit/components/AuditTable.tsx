import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { AuditResultBadge } from "@/features/audit/components/AuditResultBadge"
import { deriveAuditResult } from "@/features/audit/api/schema"
import { formatEventType } from "@/features/audit/utils"
import type { AuditEvent } from "@/features/audit/api/schema"
import { formatDateTime } from "@/features/users/utils"

// Column widths match the design (1136px total)
const COL_TIMESTAMP = "w-[170px] shrink-0"
const COL_EVENT_TYPE = "w-[220px] shrink-0"
const COL_USER = "w-[197px] shrink-0"
const COL_ACTOR = "w-[197px] shrink-0"
const COL_TENANT = "w-[260px] shrink-0"
const COL_RESULT = "w-[120px] shrink-0"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

type AuditTableProps = {
  events: AuditEvent[]
  isLoading: boolean
  onRowClick: (event: AuditEvent) => void
}

export function AuditTable({ events, isLoading, onRowClick }: AuditTableProps) {
  const { t } = useTranslation("audit")

  return (
    <div className="w-full" data-testid="audit-table">
      {/* Header */}
      <div className="flex border-b border-border h-10 items-center">
        <div
          className={`${COL_TIMESTAMP} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.timestamp")}
        </div>
        <div
          className={`${COL_EVENT_TYPE} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.eventType")}
        </div>
        <div className={`${COL_USER} px-2 text-sm font-medium text-foreground`}>
          {t("table.columns.userAffected")}
        </div>
        <div
          className={`${COL_ACTOR} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.performedBy")}
        </div>
        <div
          className={`${COL_TENANT} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.tenant")}
        </div>
        <div
          className={`${COL_RESULT} px-2 text-sm font-medium text-foreground`}
        >
          {t("table.columns.result")}
        </div>
        <div className="shrink-0 w-8" />
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
              <div className={`${COL_EVENT_TYPE} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-28" />
              </div>
              <div className={`${COL_USER} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-24" />
              </div>
              <div className={`${COL_ACTOR} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-32" />
              </div>
              <div className={`${COL_TENANT} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-40" />
              </div>
              <div className={`${COL_RESULT} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-16" />
              </div>
              <div className="shrink-0 w-8" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && events.length === 0 && (
        <div
          className={`flex justify-center items-center ${ROW_H}`}
          data-testid="audit-table-empty"
        >
          <span className="text-sm text-muted-foreground">
            {t("table.empty")}
          </span>
        </div>
      )}

      {/* Data rows */}
      {!isLoading &&
        events.map(event => {
          const result = deriveAuditResult(event.event_type)

          return (
            <div
              key={event.id}
              data-testid={`audit-row-${event.id}`}
              className={`flex border-b border-border ${ROW_H} items-center hover:bg-muted transition-colors cursor-pointer`}
              onClick={() => onRowClick(event)}
            >
              <div className={`${COL_TIMESTAMP} p-2`}>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDateTime(event.recorded_at)}
                </span>
              </div>

              <div className={`${COL_EVENT_TYPE} p-2`}>
                <span
                  className="text-sm text-foreground truncate block"
                  title={event.event_type}
                >
                  {formatEventType(event.event_type)}
                </span>
              </div>

              <div className={`${COL_USER} p-2`}>
                <span className="text-sm text-foreground truncate block">
                  {event.entity_display ?? "—"}
                </span>
              </div>

              <div className={`${COL_ACTOR} p-2`}>
                <span className="text-xs font-mono text-foreground truncate block">
                  {event.actor_id}
                </span>
              </div>

              <div className={`${COL_TENANT} p-2`}>
                <span className="text-xs font-mono text-muted-foreground truncate block">
                  {event.tenant_id ?? "—"}
                </span>
              </div>

              <div className={`${COL_RESULT} p-2`}>
                <AuditResultBadge result={result} />
              </div>

              <div
                className="shrink-0 w-8 flex items-center justify-center"
                onClick={e => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  data-testid={`audit-row-expand-${event.id}`}
                  onClick={() => onRowClick(event)}
                  className="text-muted-foreground"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )
        })}
    </div>
  )
}
