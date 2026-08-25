import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { parseISO, startOfToday } from "date-fns"
import { History, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import { FilterCheckboxOption } from "@/components/ui/filter-checkbox-option"
import { FilterPill } from "@/components/ui/filter-pill"
import { DatePicker } from "@/components/ui/date-picker"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { useFrameworkAgreementAuditHistory } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementAuditHistory"
import { useFrameworkAgreementReconstruct } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementReconstruct"
import { useExportFrameworkAgreementAuditHistoryCsv } from "@/features/frameworkAgreements/hooks/useExportFrameworkAgreementAuditHistoryCsv"
import { FAEventTypeFilterSchema } from "@/features/frameworkAgreements/api/schema"
import {
  toAsOfInstant,
  toAuditRangeEnd,
  toAuditRangeStart,
} from "@/features/frameworkAgreements/utils"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { FA_STATUS_BADGE_VARIANT } from "@/features/frameworkAgreements/constants"
import type {
  FAAgreementLifecycle,
  FAAuditEventResponse,
  FAEventTypeFilter,
} from "@/features/frameworkAgreements/api/schema"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import { downloadBlob } from "@/lib/download"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/formatters"
import { BACK_OFFICE_ROLE } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"

const AUDIT_HISTORY_PAGE_SIZE = 50

type AuditView = "eventLog" | "reconstruct"

// Primary fields highlighted on the reconstructed-state card, in display order —
// matches the Figma "RECONSTRUCT" section. Any other field the BE snapshot
// includes still renders below via the generic fallback, so nothing is hidden.
// "status" is handled separately (below) since its label isn't a plain fields.* key.
const RECONSTRUCT_PRIMARY_FIELDS = [
  { key: "max_volume_eur", labelKey: "fields.maxVolumeEur" as const },
  { key: "valid_until", labelKey: "fields.validUntil" as const },
  // base_rate and effective_rate are retained deliberately: they no longer exist on the
  // agreement (CR-FA-01), but a reconstruct to a past date still returns them, and
  // vfe_rate-era events predate CR-FA-02's switch to an amount.
  { key: "base_rate", labelKey: "fields.baseRate" as const },
  { key: "effective_rate", labelKey: "fields.effectiveRate" as const },
  { key: "vfe_amount_eur", labelKey: "fields.vfeAmountEur" as const },
]

function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

// FAAuditEventResponse.event_type is the full dotted DB event type
// (e.g. "framework_agreement.activated"); the `type[]` filter enum and this
// component's i18n keys use the short form without the prefix — see
// FAEventTypeFilter.to_audit_event_type() in refinext-api fa_schemas.py.
function stripEventTypePrefix(eventType: string): string {
  return eventType.replace(/^framework_agreement\./, "")
}

function EventCard({ event }: { event: FAAuditEventResponse }) {
  const { t } = useTranslation("frameworkAgreements")
  const actorDisplay =
    [event.actor_first_name, event.actor_last_name].filter(Boolean).join(" ") ||
    t("auditHistory.systemActor")
  const shortEventType = stripEventTypePrefix(event.event_type)

  return (
    <div
      className="flex flex-col gap-2 py-3 border-b border-border last:border-b-0"
      data-testid={`audit-event-${event.id}`}
    >
      <p className="text-sm font-semibold text-foreground">
        {t(
          `auditHistory.eventTypes.${shortEventType}` as "auditHistory.eventTypes.edited",
          { defaultValue: shortEventType }
        )}
      </p>
      <p className="text-xs text-muted-foreground">
        {actorDisplay} · {formatDateTime(event.recorded_at)}
      </p>
      {event.justification && (
        <p className="text-xs text-foreground">
          &ldquo;{event.justification}&rdquo;
        </p>
      )}
      {event.field_diffs && event.field_diffs.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {event.field_diffs.map(diff => (
            <div
              key={diff.field}
              className="flex items-center gap-2 text-xs"
              data-testid={`audit-diff-${event.id}-${diff.field}`}
            >
              <span className="text-muted-foreground">{diff.field}:</span>
              <span className="text-foreground">
                {formatDiffValue(diff.old_value)}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground">
                {formatDiffValue(diff.new_value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// One label/value pair on the reconstructed-state grid: uppercase caption above the value
// (Figma 27:2848 "Titles"). The value is a node rather than a string so a status badge and
// the product-template chips use the same cell as the plain text fields.
function StateField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1 items-start", className)}>
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

// Rendered by both views: the event log shows it filtered, and Reconstruct shows the same
// list bounded at the as-of instant (Figma 27:2576 "Events up to …") — the reconstruct
// response carries only a replayed-state snapshot, never the events behind it.
function AuditEventList({
  isLoading,
  isError,
  events,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  isLoading: boolean
  isError: boolean
  events: FAAuditEventResponse[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}) {
  const { t } = useTranslation("frameworkAgreements")

  if (isLoading) return <div className="h-48 animate-pulse bg-muted rounded" />

  if (isError)
    return <p className="text-sm text-destructive">{t("errors.generic")}</p>

  if (events.length === 0)
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {t("auditHistory.noEvents")}
      </p>
    )

  return (
    <>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
      {hasNextPage && (
        <div className="pt-3 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            data-testid="audit-load-more"
          >
            {isFetchingNextPage
              ? t("auditHistory.loadingMore")
              : t("auditHistory.loadMore")}
          </Button>
        </div>
      )}
    </>
  )
}

type Props = {
  frameworkAgreementId: string
  currentUserRole: UserRole | null
}

function AuditHistoryTab({ frameworkAgreementId, currentUserRole }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")
  const [activeView, setActiveView] = useState<AuditView>("eventLog")
  const [search, setSearch] = useState("")
  const [eventTypeFilters, setEventTypeFilters] = useState<FAEventTypeFilter[]>(
    []
  )
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)
  const [asOfDate, setAsOfDate] = useState<string | null>(null)
  const [asOfTime, setAsOfTime] = useState("")
  const [submittedAsOf, setSubmittedAsOf] = useState<string | null>(null)
  const [showFullState, setShowFullState] = useState(false)
  const [exportReason, setExportReason] = useState("")

  const reasonRequired = currentUserRole === BACK_OFFICE_ROLE
  const today = startOfToday()

  // The snapshot stores template ids; the only name source is the current selectable list,
  // so a template retired since the reconstructed date resolves to nothing and falls back
  // to its id rather than rendering a blank chip.
  const templatesQuery = useSelectableProductTemplates()
  const templateNameById = new Map(
    (templatesQuery.data?.items ?? []).map(tpl => [
      tpl.template_id,
      tpl.template_name,
    ])
  )

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFrameworkAgreementAuditHistory(
    frameworkAgreementId,
    // Reconstruct answers "what did this look like then", so its list is bounded at the
    // as-of instant and ignores the event-log's own filters rather than intersecting with
    // filters the user cannot see from that view.
    activeView === "reconstruct"
      ? {
          per_page: AUDIT_HISTORY_PAGE_SIZE,
          ...(submittedAsOf ? { to: submittedAsOf } : {}),
        }
      : {
          per_page: AUDIT_HISTORY_PAGE_SIZE,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(eventTypeFilters.length > 0 ? { type: eventTypeFilters } : {}),
          ...(fromDate ? { from: toAuditRangeStart(fromDate) } : {}),
          ...(toDate ? { to: toAuditRangeEnd(toDate) } : {}),
        }
  )

  const reconstructQuery = useFrameworkAgreementReconstruct(
    frameworkAgreementId,
    submittedAsOf
  )
  const exportMutation = useExportFrameworkAgreementAuditHistoryCsv()

  const events = data?.pages.flatMap(p => p.items) ?? []

  function toggleEventType(type: FAEventTypeFilter) {
    setEventTypeFilters(prev =>
      prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]
    )
  }

  function clearAllFilters() {
    setEventTypeFilters([])
    setFromDate(null)
    setToDate(null)
  }

  function handleReconstruct() {
    if (!asOfDate) return
    setShowFullState(false)
    setSubmittedAsOf(toAsOfInstant(asOfDate, asOfTime))
  }

  function handleExport() {
    exportMutation.mutate(
      {
        id: frameworkAgreementId,
        params: {
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(eventTypeFilters.length > 0 ? { type: eventTypeFilters } : {}),
          ...(fromDate ? { from: toAuditRangeStart(fromDate) } : {}),
          ...(toDate ? { to: toAuditRangeEnd(toDate) } : {}),
          ...(exportReason.trim() ? { reason: exportReason.trim() } : {}),
        },
      },
      {
        onSuccess: blob =>
          downloadBlob(blob, `fa-audit-${frameworkAgreementId}.csv`),
        onError: err => {
          showApiError(err, t)
        },
      }
    )
  }

  const hasActiveFilters = eventTypeFilters.length > 0 || !!fromDate || !!toDate

  function renderStateFieldValue(key: string, value: unknown): string {
    if (key === "status" && typeof value === "string") {
      return t(`statuses.${value}` as "statuses.active", {
        defaultValue: value,
      })
    }
    if (
      (key === "base_rate" || key === "effective_rate" || key === "vfe_rate") &&
      value !== null
    ) {
      return `${formatDiffValue(value)}%`
    }
    if (key === "vfe_amount_eur" && value !== null) {
      return `${formatDiffValue(value)} ${EUR_CURRENCY_CODE}`
    }
    if (key === "valid_until" && value === null) {
      return t("fields.openEnded")
    }
    return formatDiffValue(value)
  }

  return (
    <div
      className="flex flex-col gap-4 mt-4"
      data-testid="fa-audit-history-tab"
    >
      <div className="flex items-center gap-2 self-end">
        <Button
          type="button"
          variant={activeView === "eventLog" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("eventLog")}
          data-testid="audit-view-event-log"
        >
          {t("auditHistory.viewEventLog")}
        </Button>
        <Button
          type="button"
          variant={activeView === "reconstruct" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("reconstruct")}
          data-testid="audit-view-reconstruct"
        >
          {t("auditHistory.viewReconstruct")}
        </Button>
      </div>

      {activeView === "reconstruct" ? (
        <SectionCard title={t("auditHistory.reconstructTitle")}>
          <div className="flex items-end gap-2 flex-wrap">
            <DatePicker
              value={asOfDate ?? undefined}
              onChange={v => setAsOfDate(v)}
              // A reconstruct only ever looks backwards, so the calendar stops at today.
              // No floor: the agreement's whole history is legitimately in range
              // (date-inputs.md §4 — this is a historical view, not a create form).
              maxDate={today}
              captionLayout="dropdown"
              className="w-48"
              data-testid="audit-reconstruct-as-of-date"
            />
            <Input
              type="time"
              value={asOfTime}
              onChange={e => setAsOfTime(e.target.value)}
              aria-label={t("auditHistory.reconstructTimeLabel")}
              className="w-32"
              data-testid="audit-reconstruct-as-of-time"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleReconstruct}
              disabled={!asOfDate}
              data-testid="audit-reconstruct-submit"
            >
              {t("auditHistory.reconstructButton")}
            </Button>
          </div>

          {!submittedAsOf && (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border py-12 text-center"
              data-testid="audit-reconstruct-empty"
            >
              <History size={24} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground max-w-xs">
                {t("auditHistory.reconstructEmpty")}
              </p>
            </div>
          )}

          {reconstructQuery.isFetching && (
            <p className="text-sm text-muted-foreground">
              {tCommon("loading")}
            </p>
          )}
          {reconstructQuery.isError && (
            <p className="text-sm text-destructive">
              {resolveApiErrorMessage(reconstructQuery.error, t)}
            </p>
          )}
          {reconstructQuery.data &&
            (() => {
              const { state } = reconstructQuery.data
              const asOfLabel = formatDateTime(reconstructQuery.data.as_of)
              // product_template_ids is excluded because it has its own chip field below —
              // counting it here would offer "View full details" on a snapshot whose only
              // remaining entry is already on screen, revealing nothing when clicked.
              const primaryKeys = new Set([
                "status",
                "product_template_ids",
                ...RECONSTRUCT_PRIMARY_FIELDS.map(f => f.key),
              ])
              const otherEntries = Object.entries(state).filter(
                ([key]) => !primaryKeys.has(key)
              )
              return (
                <div className="flex flex-col gap-4">
                  <Alert variant="info" data-testid="audit-reconstruct-banner">
                    <Info />
                    <AlertDescription>
                      {t("auditHistory.reconstructBanner", { date: asOfLabel })}
                    </AlertDescription>
                  </Alert>

                  <div
                    className="flex flex-col overflow-hidden rounded-xl border border-info"
                    data-testid="audit-reconstruct-state"
                  >
                    <div className="flex items-center gap-2 bg-info/10 px-4 py-2">
                      <p className="flex-1 text-sm font-semibold text-foreground">
                        {t("auditHistory.stateCardTitle", { date: asOfLabel })}
                      </p>
                      {otherEntries.length > 0 && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => setShowFullState(v => !v)}
                          data-testid="audit-reconstruct-toggle-details"
                        >
                          {showFullState
                            ? t("auditHistory.hideFullDetails")
                            : t("auditHistory.viewFullDetails")}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-10 gap-y-8 bg-card p-4">
                      {Object.hasOwn(state, "status") && (
                        <StateField label={t("detail.fields.status")}>
                          <Badge
                            variant={
                              FA_STATUS_BADGE_VARIANT[
                                state.status as FAAgreementLifecycle
                              ] ?? "outline"
                            }
                          >
                            {renderStateFieldValue("status", state.status)}
                          </Badge>
                        </StateField>
                      )}
                      {RECONSTRUCT_PRIMARY_FIELDS.filter(({ key }) =>
                        Object.hasOwn(state, key)
                      ).map(({ key, labelKey }) => (
                        <StateField key={key} label={t(labelKey)}>
                          <span className="text-sm text-foreground">
                            {renderStateFieldValue(key, state[key])}
                          </span>
                        </StateField>
                      ))}
                      {Array.isArray(state.product_template_ids) && (
                        <StateField
                          label={t("fields.allowedProductTemplates")}
                          className="col-span-full"
                        >
                          <div className="flex flex-wrap gap-1.5">
                            {state.product_template_ids.map(id => (
                              <Badge key={String(id)} variant="outline">
                                {templateNameById.get(String(id)) ?? String(id)}
                              </Badge>
                            ))}
                          </div>
                        </StateField>
                      )}
                      {showFullState &&
                        otherEntries.map(([field, value]) => (
                          <StateField key={field} label={field}>
                            <span className="text-sm text-foreground">
                              {formatDiffValue(value)}
                            </span>
                          </StateField>
                        ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">
                      {t("auditHistory.eventsUpTo", { date: asOfLabel })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("auditHistory.eventsReplayed", {
                        count: reconstructQuery.data.events_replayed,
                      })}
                    </p>
                  </div>

                  <AuditEventList
                    isLoading={isLoading}
                    isError={isError}
                    events={events}
                    hasNextPage={!!hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onLoadMore={() => fetchNextPage()}
                  />
                </div>
              )
            })()}
        </SectionCard>
      ) : (
        <>
          <div className="flex items-center gap-6 flex-wrap">
            <SearchInput
              data-testid="audit-filter-search"
              placeholder={t("auditHistory.searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-72"
            />
            <div className="flex items-center gap-2">
              <FilterButton
                label={t("auditHistory.filterEventType")}
                count={eventTypeFilters.length}
                contentClassName="w-64"
                data-testid="audit-filter-event-type"
              >
                <div className="max-h-72 overflow-y-auto py-1">
                  {FAEventTypeFilterSchema.options.map(type => (
                    <FilterCheckboxOption
                      key={type}
                      checked={eventTypeFilters.includes(type)}
                      onClick={() => toggleEventType(type)}
                      data-testid={`audit-filter-event-type-${type}`}
                    >
                      <span className="text-sm text-foreground">
                        {t(
                          `auditHistory.eventTypes.${type}` as "auditHistory.eventTypes.edited",
                          { defaultValue: type }
                        )}
                      </span>
                    </FilterCheckboxOption>
                  ))}
                </div>
              </FilterButton>

              <FilterButton
                label={t("auditHistory.filterDateRange")}
                count={[fromDate, toDate].filter(Boolean).length}
                icon="calendar"
                contentClassName="w-72 py-0"
                data-testid="audit-filter-date-range"
              >
                <div className="p-3">
                  {/* Both bounds are capped at today — audit history only looks backwards —
                      and the pair is kept in sync so a `to` before its own `from` cannot be
                      picked. Neither is floored at today: this is a filter, not a create form. */}
                  <div className="flex gap-2">
                    <DatePicker
                      value={fromDate ?? undefined}
                      onChange={v => setFromDate(v)}
                      placeholder={t("auditHistory.from")}
                      maxDate={toDate ? parseISO(toDate) : new Date()}
                      captionLayout="dropdown"
                      data-testid="audit-filter-date-from"
                    />
                    <DatePicker
                      value={toDate ?? undefined}
                      onChange={v => setToDate(v)}
                      placeholder={t("auditHistory.to")}
                      minDate={fromDate ? parseISO(fromDate) : undefined}
                      maxDate={new Date()}
                      captionLayout="dropdown"
                      data-testid="audit-filter-date-to"
                    />
                  </div>
                </div>
              </FilterButton>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {eventTypeFilters.map(type => (
                <FilterPill
                  key={type}
                  label={t(
                    `auditHistory.eventTypes.${type}` as "auditHistory.eventTypes.edited",
                    { defaultValue: type }
                  )}
                  onRemove={() => toggleEventType(type)}
                  data-testid={`audit-filter-pill-${type}`}
                />
              ))}
              {(fromDate || toDate) && (
                <FilterPill
                  label={[fromDate, toDate].filter(Boolean).join(" – ")}
                  onRemove={() => {
                    setFromDate(null)
                    setToDate(null)
                  }}
                  data-testid="audit-filter-pill-date"
                />
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={clearAllFilters}
                data-testid="audit-filter-clear-all"
                className="h-auto px-2 py-0 text-xs font-normal text-destructive hover:text-destructive hover:bg-transparent hover:opacity-80 transition-opacity"
              >
                {t("auditHistory.clearAll")}
              </Button>
            </div>
          )}

          <SectionCard title={t("auditHistory.sectionTitle")}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Input
                placeholder={t("auditHistory.exportReasonPlaceholder")}
                value={exportReason}
                onChange={e => setExportReason(e.target.value)}
                className="w-64"
                data-testid="audit-export-reason"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={
                  exportMutation.isPending ||
                  (reasonRequired && !exportReason.trim())
                }
                data-testid="audit-export-button"
              >
                {t("auditHistory.exportButton")}
              </Button>
            </div>

            {isLoading && (
              <div className="h-48 animate-pulse bg-muted rounded" />
            )}

            {isError && !isLoading && (
              <p className="text-sm text-destructive">{t("errors.generic")}</p>
            )}

            {!isLoading && !isError && events.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("auditHistory.noEvents")}
              </p>
            )}

            {!isLoading && !isError && events.length > 0 && (
              <>
                {events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
                {hasNextPage && (
                  <div className="pt-3 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      data-testid="audit-load-more"
                    >
                      {isFetchingNextPage
                        ? t("auditHistory.loadingMore")
                        : t("auditHistory.loadMore")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}

export { AuditHistoryTab }
