import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import {
  formatEventType,
  formatActionType,
  formatDateTime,
} from "@/lib/formatters"
import type { AuditEventListItem } from "@/features/audit/api/schema"

const COL_TIMESTAMP = "w-[160px] shrink-0"
const COL_ENTITY = "w-[180px] shrink-0"
const COL_ENTITY_TYPE = "w-[120px] shrink-0"
const COL_EVENT = "w-[220px] shrink-0"
const COL_ACTOR = "flex-1 min-w-0"
const COL_FLAG = "w-[100px] shrink-0"
const COL_CHEVRON = "w-[32px] shrink-0"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

const ENTITY_TYPE_STYLES: Record<string, string> = {
  user: "border-sky-500 text-sky-700",
  contract: "border-teal-500 text-teal-700",
  financing: "border-amber-500 text-amber-700",
  request: "border-violet-500 text-violet-700",
  document: "border-slate-400 text-slate-600",
  partner: "border-rose-500 text-rose-700",
  system: "border-zinc-400 text-zinc-600",
}

function EntityTypeBadge({ entityType }: { entityType: string }) {
  const { t } = useTranslation("audit")
  const style =
    ENTITY_TYPE_STYLES[entityType] ?? "border-border text-muted-foreground"
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-1.5 py-0.5 text-xs font-medium leading-4 whitespace-nowrap",
        style
      )}
    >
      {t(`entityType.${entityType}`, {
        defaultValue: formatActionType(entityType),
      })}
    </span>
  )
}

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
              <div className={`${COL_FLAG} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-12" />
              </div>
              <div className={COL_CHEVRON} />
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
        events.map(event => (
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
                  {event.entity_id.slice(0, 8)}…
                </span>
              )}
            </div>

            <div className={`${COL_ENTITY_TYPE} p-2`}>
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
