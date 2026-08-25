import { useState } from "react"
import { useTranslation } from "react-i18next"
import { format, parseISO } from "date-fns"
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
  toAuditRangeEnd,
  toAuditRangeStart,
} from "@/features/frameworkAgreements/utils"
import type {
  FAAuditEventResponse,
  FAEventTypeFilter,
} from "@/features/frameworkAgreements/api/schema"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import { downloadBlob } from "@/lib/download"
import { formatDateTime } from "@/lib/formatters"
import { BACK_OFFICE_ROLE } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"

const AUDIT_HISTORY_PAGE_SIZE = 50
// `datetime-local` reads and writes wall-clock time, so its `max` must be built from local
// parts — toISOString() would cap the picker at the user's UTC offset instead of now.
const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm"

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
  const [asOfInput, setAsOfInput] = useState("")
  const [submittedAsOf, setSubmittedAsOf] = useState<string | null>(null)
  const [exportReason, setExportReason] = useState("")

  const reasonRequired = currentUserRole === BACK_OFFICE_ROLE

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFrameworkAgreementAuditHistory(frameworkAgreementId, {
    per_page: AUDIT_HISTORY_PAGE_SIZE,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(eventTypeFilters.length > 0 ? { type: eventTypeFilters } : {}),
    ...(fromDate ? { from: toAuditRangeStart(fromDate) } : {}),
    ...(toDate ? { to: toAuditRangeEnd(toDate) } : {}),
  })

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
    if (!asOfInput) return
    setSubmittedAsOf(new Date(asOfInput).toISOString())
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
            {/* NOTE: native datetime-local rather than the shadcn DatePicker used for the
                event-log filters below — GET /reconstruct takes `as_of` as a full
                ISO8601 date-time, and DatePicker is date-only (it emits yyyy-MM-dd).
                Convert both to a shared datetime primitive if a second such field
                appears; one call site does not justify building one. */}
            <Input
              type="datetime-local"
              value={asOfInput}
              onChange={e => setAsOfInput(e.target.value)}
              max={format(new Date(), DATETIME_LOCAL_FORMAT)}
              className="w-56"
              data-testid="audit-reconstruct-as-of"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleReconstruct}
              disabled={!asOfInput}
              data-testid="audit-reconstruct-submit"
            >
              {t("auditHistory.reconstructButton")}
            </Button>
          </div>

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
              const primaryKeys = new Set([
                "status",
                ...RECONSTRUCT_PRIMARY_FIELDS.map(f => f.key),
              ])
              const otherEntries = Object.entries(state).filter(
                ([key]) => !primaryKeys.has(key)
              )
              return (
                <div className="flex flex-col gap-3">
                  <p
                    className="text-xs text-foreground rounded-lg bg-muted px-3 py-2"
                    data-testid="audit-reconstruct-banner"
                  >
                    {t("auditHistory.reconstructBanner", {
                      date: formatDateTime(reconstructQuery.data.as_of),
                    })}
                  </p>
                  <div
                    className="flex flex-col gap-2 rounded-lg border border-border p-3"
                    data-testid="audit-reconstruct-state"
                  >
                    <p className="text-xs text-muted-foreground">
                      {t("auditHistory.eventsReplayed", {
                        count: reconstructQuery.data.events_replayed,
                      })}
                    </p>
                    {Object.hasOwn(state, "status") && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {t("detail.fields.status")}:
                        </span>
                        <span className="text-foreground">
                          {renderStateFieldValue("status", state.status)}
                        </span>
                      </div>
                    )}
                    {RECONSTRUCT_PRIMARY_FIELDS.filter(({ key }) =>
                      Object.hasOwn(state, key)
                    ).map(({ key, labelKey }) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {t(labelKey)}:
                        </span>
                        <span className="text-foreground">
                          {renderStateFieldValue(key, state[key])}
                        </span>
                      </div>
                    ))}
                    {otherEntries.map(([field, value]) => (
                      <div
                        key={field}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-muted-foreground">{field}:</span>
                        <span className="text-foreground">
                          {formatDiffValue(value)}
                        </span>
                      </div>
                    ))}
                  </div>
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
