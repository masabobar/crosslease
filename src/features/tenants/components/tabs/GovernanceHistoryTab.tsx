import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { parseISO } from "date-fns"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import { FilterCheckboxOption } from "@/components/ui/filter-checkbox-option"
import { FilterPill } from "@/components/ui/filter-pill"
import { DatePicker } from "@/components/ui/date-picker"
import { TenantInfoCard } from "@/features/tenants/components/TenantInfoCard"
import { SoftBadge } from "@/features/tenants/components/SoftBadge"
import type { SoftBadgeTone } from "@/features/tenants/components/SoftBadge"
import { useTenantGovernanceHistory } from "@/features/tenants/hooks/useTenantGovernanceHistory"
import { formatDate, formatDateTime } from "@/lib/formatters"
import type { GovernanceHistoryEvent } from "@/features/tenants/api/schema"
import { GovernanceEventTypeSchema } from "@/features/tenants/api/schema"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

const GOVERNANCE_HISTORY_PAGE_SIZE = 50

const GOVERNANCE_EVENT_TYPES = GovernanceEventTypeSchema.options

// Fallback only. The backend owns the event taxonomy and adds to it, so a type this
// build has no i18n key for still needs to render as something readable rather than
// as a raw wire value. Known types go through `eventTypeLabel` below.
function humaniseEventType(eventType: string): string {
  return eventType.replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

// The wire value's dots line up with i18next's key separator, so
// "tenant.suspend_requested" resolves at detail.governance.eventTypes.tenant.suspend_requested.
function eventTypeLabel(t: TFunction<"tenants">, eventType: string): string {
  return t(
    `detail.governance.eventTypes.${eventType}` as "detail.governance.eventTypes.tenant.activated",
    { defaultValue: humaniseEventType(eventType) }
  )
}

// old_data/new_data are free-form payloads, so the extracted token may be anything;
// an unknown one falls back to its humanised form rather than rendering raw.
function stateLabel(t: TFunction<"tenants">, token: string): string {
  return t(
    `detail.governance.stateLabels.${token}` as "detail.governance.stateLabels.active",
    { defaultValue: humaniseEventType(token) }
  )
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
  const type = eventType.toLowerCase()
  if (
    type.includes("blocked") ||
    type.includes("denied") ||
    type.includes("security") ||
    type.includes("rejected")
  )
    return "danger"
  if (type.includes("grant") || type.includes("suspended")) return "warning"
  if (
    type.includes("activated") ||
    type.includes("modified") ||
    type.includes("approved") ||
    type.includes("enabled") ||
    type.includes("permitted")
  )
    return "success"
  if (
    type.includes("created") ||
    type.includes("requested") ||
    type.includes("deactivated")
  )
    return "neutral"
  return "primary"
}

// Keyed on free-form values lifted out of the event's old_data/new_data payload,
// not on a wire enum — hence the string index and the neutral default.
const STATUS_BADGE_TONE: Record<string, SoftBadgeTone> = {
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

function stateTone(label: string): SoftBadgeTone {
  return STATUS_BADGE_TONE[label.toLowerCase()] ?? "neutral"
}

// Returns the state *token* (a machine value), never a display string — the caller
// translates it via stateLabel(). See .claude/rules/enums-and-constants.md §5.
function extractStatusValue(
  data: Record<string, unknown> | null
): string | null {
  if (!data) return null
  if (typeof data.status === "string") return data.status
  if (typeof data.enabled === "boolean")
    return data.enabled ? "enabled" : "disabled"
  if (typeof data.state === "string") return data.state
  return null
}

function isSecurityEvent(eventType: string): boolean {
  const type = eventType.toLowerCase()
  return (
    type.includes("blocked") ||
    type.includes("security") ||
    type.includes("denied")
  )
}

function formatEventTitle(
  t: TFunction<"tenants">,
  event: GovernanceHistoryEvent
): string {
  const base = eventTypeLabel(t, event.event_type)
  const entityName =
    (event.new_data?.["name"] as string | undefined) ??
    (event.new_data?.["display_name"] as string | undefined) ??
    (event.old_data?.["name"] as string | undefined) ??
    null
  return entityName ? `${base}: ${entityName}` : base
}

function EventRow({
  event,
  isLast,
}: {
  event: GovernanceHistoryEvent
  isLast: boolean
}) {
  const { t } = useTranslation("tenants")
  const indicatorClass = INDICATOR_CLASSES[getIndicatorColor(event.event_type)]

  const oldValue = extractStatusValue(event.old_data)
  const newValue = extractStatusValue(event.new_data)

  const title = formatEventTitle(t, event)
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
          {isSecurityEvent(event.event_type) && (
            <SoftBadge
              label={t("detail.governance.securityEvent")}
              tone="danger"
            />
          )}
        </div>

        {actorLine && (
          <span className="text-xs text-muted-foreground leading-4">
            {actorLine}
          </span>
        )}

        {oldValue !== null && newValue !== null && (
          <div className="flex items-center gap-2.5">
            <SoftBadge
              label={stateLabel(t, oldValue)}
              tone={stateTone(oldValue)}
            />
            <ArrowRight size={16} className="text-muted-foreground shrink-0" />
            <SoftBadge
              label={stateLabel(t, newValue)}
              tone={stateTone(newValue)}
            />
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

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTenantGovernanceHistory(tenantId, {
    per_page: GOVERNANCE_HISTORY_PAGE_SIZE,
    ...(eventTypeFilters.length > 0 ? { event_types: eventTypeFilters } : {}),
    ...(fromDate ? { from_date: fromDate } : {}),
    ...(toDate ? { to_date: toDate } : {}),
  })

  const events = data?.pages.flatMap(p => p.events) ?? []

  const filteredEvents = search.trim()
    ? events.filter(event => {
        const q = search.toLowerCase()
        return (
          // Matches the label the user can actually see, not the wire value.
          eventTypeLabel(t, event.event_type).toLowerCase().includes(q) ||
          (event.actor_display?.toLowerCase().includes(q) ?? false) ||
          (event.reason?.toLowerCase().includes(q) ?? false)
        )
      })
    : events

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
          data-testid="governance-search"
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
              {GOVERNANCE_EVENT_TYPES.map(type => (
                <FilterCheckboxOption
                  key={type}
                  checked={eventTypeFilters.includes(type)}
                  onClick={() => toggleEventType(type)}
                  data-testid={`filter-event-type-${type}`}
                >
                  <span className="text-sm text-foreground">
                    {eventTypeLabel(t, type)}
                  </span>
                </FilterCheckboxOption>
              ))}
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
                  captionLayout="dropdown"
                  data-testid="governance-filter-from-date"
                />
                <DatePicker
                  value={toDate ?? undefined}
                  onChange={v => setToDate(v)}
                  placeholder={t("list.filters.to")}
                  maxDate={new Date()}
                  minDate={fromDate ? parseISO(fromDate) : undefined}
                  captionLayout="dropdown"
                  data-testid="governance-filter-to-date"
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
              label={eventTypeLabel(t, type)}
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
            {resolveApiErrorMessage(error, t)}
          </p>
        )}

        {/* Search narrows only the pages fetched so far, so an empty result with
            more pages available is reported differently from a truly empty history. */}
        {!isLoading && !isError && filteredEvents.length === 0 && (
          <div className="py-4 flex flex-col items-center gap-1">
            <p className="text-sm text-muted-foreground">
              {events.length > 0
                ? t("detail.governance.noSearchMatches")
                : t("detail.governance.noEvents")}
            </p>
            {events.length > 0 && hasNextPage && (
              <p className="text-xs text-muted-foreground">
                {t("detail.governance.searchMoreHint")}
              </p>
            )}
          </div>
        )}

        {!isLoading &&
          !isError &&
          filteredEvents.map((event, i) => (
            <EventRow
              key={event.id}
              event={event}
              isLast={i === filteredEvents.length - 1 && !hasNextPage}
            />
          ))}

        {!isLoading && !isError && hasNextPage && (
          <div className="pt-3 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              data-testid="governance-load-more"
            >
              {isFetchingNextPage
                ? t("detail.governance.loadingMore")
                : t("detail.governance.loadMore")}
            </Button>
          </div>
        )}
      </TenantInfoCard>
    </div>
  )
}
