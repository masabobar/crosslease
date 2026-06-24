import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { parseISO } from "date-fns"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import { FilterPill } from "@/components/ui/filter-pill"
import { DatePicker } from "@/components/ui/date-picker"
import { TenantInfoCard } from "@/features/tenants/components/TenantInfoCard"
import { useTenantGovernanceHistory } from "@/features/tenants/hooks/useTenantGovernanceHistory"
import { formatDate } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { GovernanceHistoryEvent } from "@/features/tenants/api/schema"

const GOVERNANCE_EVENT_TYPES = [
  "tenant.creation_requested",
  "tenant.activated",
  "tenant.create_rejected",
  "tenant.create_expired",
  "tenant.create_reinitiated",
  "tenant.modified",
  "tenant.mfa_policy_changed",
  "tenant.access_policy_modified",
  "tenant.suspend_requested",
  "tenant.suspended",
  "tenant.reactivate_requested",
  "tenant.reactivated",
  "tenant.archive_requested",
  "tenant.archived",
  "tenant.module_activation_requested",
  "tenant.module_activated",
  "tenant.module_deactivated",
  "support_grant.created",
  "support_grant.revoked",
  "support_grant.expired",
  "support_grant.emergency_review_completed",
  "security.permission_denied",
  "security.cross_tenant_attempt",
  "security.cross_tenant_access_permitted",
  "security.cross_tenant_access_blocked",
] as const

function formatEventTypeLabel(eventType: string): string {
  return eventType.replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

type IndicatorColor = "success" | "danger" | "warning" | "primary" | "neutral"

const INDICATOR_CLASSES: Record<IndicatorColor, string> = {
  success: "bg-[#16a34a]",
  danger: "bg-[#e6000a]",
  warning: "bg-amber-600",
  primary: "bg-primary",
  neutral: "bg-slate-400",
}

function getIndicatorColor(eventType: string): IndicatorColor {
  const t = eventType.toLowerCase()
  if (
    t.includes("blocked") ||
    t.includes("denied") ||
    t.includes("security") ||
    t.includes("rejected")
  )
    return "danger"
  if (t.includes("grant") || t.includes("suspended")) return "warning"
  if (
    t.includes("activated") ||
    t.includes("modified") ||
    t.includes("approved") ||
    t.includes("enabled") ||
    t.includes("permitted")
  )
    return "success"
  if (
    t.includes("created") ||
    t.includes("requested") ||
    t.includes("deactivated")
  )
    return "neutral"
  return "primary"
}

type BadgeVariant = "neutral" | "success" | "info" | "danger"

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  neutral: { bg: "bg-[rgba(244,244,245,0.6)]", text: "text-foreground" },
  success: { bg: "bg-[rgba(22,163,74,0.1)]", text: "text-[#16a34a]" },
  info: { bg: "bg-[rgba(2,132,199,0.1)]", text: "text-[#0284c7]" },
  danger: { bg: "bg-[rgba(224,52,52,0.1)]", text: "text-[#e6000a]" },
}

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  active: "success",
  enabled: "success",
  approved: "success",
  draft: "info",
  pending: "info",
  inactive: "neutral",
  disabled: "neutral",
  revoked: "danger",
  rejected: "danger",
  suspended: "danger",
}

function SoftBadge({ label }: { label: string }) {
  const variant: BadgeVariant =
    STATUS_BADGE_VARIANT[label.toLowerCase()] ?? "neutral"
  const { bg, text } = BADGE_STYLES[variant]
  return (
    <span
      className={`inline-flex items-center h-[18px] px-1.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  )
}

function extractStatusValue(
  data: Record<string, unknown> | null
): string | null {
  if (!data) return null
  if (typeof data.status === "string") return data.status
  if (typeof data.enabled === "boolean")
    return data.enabled ? "Enabled" : "Disabled"
  if (typeof data.state === "string") return data.state
  return null
}

function getCategoryBadge(
  eventType: string
): { label: string; variant: BadgeVariant } | null {
  const t = eventType.toLowerCase()
  if (t.includes("blocked") || t.includes("security") || t.includes("denied"))
    return { label: "Security event", variant: "danger" }
  return null
}

function formatEventTitle(event: GovernanceHistoryEvent): string {
  const base = event.event_type
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
  const entityName =
    (event.new_data?.["name"] as string | undefined) ??
    (event.new_data?.["display_name"] as string | undefined) ??
    (event.old_data?.["name"] as string | undefined) ??
    null
  return entityName ? `${base}: ${entityName}` : base
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function EventRow({
  event,
  isLast,
}: {
  event: GovernanceHistoryEvent
  isLast: boolean
}) {
  const indicatorClass = INDICATOR_CLASSES[getIndicatorColor(event.event_type)]
  const categoryBadge = getCategoryBadge(event.event_type)

  const oldValue = extractStatusValue(event.old_data)
  const newValue = extractStatusValue(event.new_data)
  const hasStateChange = oldValue !== null && newValue !== null

  const title = formatEventTitle(event)
  const actorLine = [event.actor_display, formatDateTime(event.recorded_at)]
    .filter(Boolean)
    .join(" · ")

  return (
    <div
      className={`flex gap-3 items-start pt-2 ${
        isLast ? "pb-3" : "pb-3 border-b border-border"
      }`}
    >
      <div className="flex items-start pt-[7px] shrink-0">
        <div
          className={`size-2 rounded-full shrink-0 shadow-[0_0_0_2px_white] ${indicatorClass}`}
        />
      </div>

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-semibold text-foreground leading-5">
            {title}
          </span>
          {categoryBadge && <SoftBadge label={categoryBadge.label} />}
        </div>

        {actorLine && (
          <span className="text-xs text-muted-foreground leading-4">
            {actorLine}
          </span>
        )}

        {hasStateChange && (
          <div className="flex items-center gap-2.5">
            <SoftBadge label={oldValue!} />
            <ArrowRight size={16} className="text-muted-foreground shrink-0" />
            <SoftBadge label={newValue!} />
          </div>
        )}

        {event.reason && (
          <span className="text-xs text-foreground leading-4">
            &ldquo;{event.reason}&rdquo;
          </span>
        )}
      </div>
    </div>
  )
}

type GovernanceHistoryTabProps = {
  tenantId: string
}

export function GovernanceHistoryTab({ tenantId }: GovernanceHistoryTabProps) {
  const { t } = useTranslation("tenants")
  const [search, setSearch] = useState("")
  const [eventTypeFilters, setEventTypeFilters] = useState<string[]>([])
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)

  const { data, isLoading, isError } = useTenantGovernanceHistory(tenantId, {
    per_page: 50,
    ...(eventTypeFilters.length > 0 ? { event_types: eventTypeFilters } : {}),
    ...(fromDate ? { from_date: fromDate } : {}),
    ...(toDate ? { to_date: toDate } : {}),
  })

  const events = data?.events ?? []

  function toggleEventType(type: string) {
    setEventTypeFilters(prev =>
      prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]
    )
  }

  function clearAllFilters() {
    setEventTypeFilters([])
    setFromDate(null)
    setToDate(null)
  }

  const dateRangeLabel = [
    fromDate ? formatDate(fromDate) : null,
    toDate ? formatDate(toDate) : null,
  ]
    .filter(Boolean)
    .join(" – ")

  const hasActiveFilters = eventTypeFilters.length > 0 || !!fromDate || !!toDate

  return (
    <div className="flex flex-col gap-4" data-testid="tab-content-governance">
      {/* Search + filters */}
      <div className="flex items-center gap-6">
        <SearchInput
          placeholder={t("detail.governance.searchPlaceholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-72"
        />
        <div className="flex items-center gap-2">
          <FilterButton
            label={t("detail.governance.filterEventType")}
            count={eventTypeFilters.length}
            contentClassName="w-64"
            data-testid="filter-event-type"
          >
            <div className="max-h-72 overflow-y-auto py-1">
              {GOVERNANCE_EVENT_TYPES.map(type => {
                const checked = eventTypeFilters.includes(type)
                return (
                  <Button
                    key={type}
                    variant="ghost"
                    onClick={() => toggleEventType(type)}
                    className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
                    data-testid={`filter-event-type-${type}`}
                  >
                    <span
                      className={cn(
                        "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
                        checked ? "bg-primary border-primary" : "border-border"
                      )}
                    >
                      {checked && <Check size={10} className="text-white" />}
                    </span>
                    <span className="text-sm text-foreground">
                      {formatEventTypeLabel(type)}
                    </span>
                  </Button>
                )
              })}
            </div>
          </FilterButton>

          <FilterButton
            label={t("detail.governance.filterDateRange")}
            count={[fromDate, toDate].filter(Boolean).length}
            icon="calendar"
            contentClassName="w-72 py-0"
            data-testid="filter-date-range"
          >
            <div className="p-3">
              <div className="flex gap-2">
                <DatePicker
                  value={fromDate ?? undefined}
                  onChange={v => {
                    const newFrom = parseISO(v)
                    const currentTo = toDate ? parseISO(toDate) : null
                    setFromDate(v)
                    if (currentTo && currentTo < newFrom) setToDate(null)
                  }}
                  placeholder={t("list.filters.from")}
                  maxDate={new Date()}
                />
                <DatePicker
                  value={toDate ?? undefined}
                  onChange={v => setToDate(v)}
                  placeholder={t("list.filters.to")}
                  maxDate={new Date()}
                  minDate={fromDate ? parseISO(fromDate) : undefined}
                />
              </div>
            </div>
          </FilterButton>
        </div>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {eventTypeFilters.map(type => (
            <FilterPill
              key={type}
              label={formatEventTypeLabel(type)}
              onRemove={() => toggleEventType(type)}
              data-testid={`filter-pill-remove-event-type-${type}`}
            />
          ))}
          {(fromDate || toDate) && (
            <FilterPill
              label={dateRangeLabel}
              onRemove={() => {
                setFromDate(null)
                setToDate(null)
              }}
              data-testid="filter-pill-remove-date"
            />
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={clearAllFilters}
            data-testid="filter-clear-all"
            className="h-auto px-2 py-0 text-xs font-normal text-destructive hover:text-destructive hover:bg-transparent hover:opacity-80 transition-opacity"
          >
            {t("detail.governance.clearAll")}
          </Button>
        </div>
      )}

      {/* Event list */}
      <TenantInfoCard title={t("detail.governance.sectionTitle")}>
        {isLoading && <div className="h-48 animate-pulse bg-muted rounded" />}

        {isError && !isLoading && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("errors.generic")}
          </p>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("detail.governance.noEvents")}
          </p>
        )}

        {!isLoading && !isError && events.length > 0 && (
          <>
            {events.map((event, i) => (
              <EventRow
                key={event.id}
                event={event}
                isLast={i === events.length - 1}
              />
            ))}
          </>
        )}
      </TenantInfoCard>
    </div>
  )
}
