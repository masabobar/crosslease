import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import { FilterPill } from "@/components/ui/filter-pill"
import { DatePicker } from "@/components/ui/date-picker"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { useFrameworkAgreementAuditHistory } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementAuditHistory"
import { useFrameworkAgreementReconstruct } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementReconstruct"
import { useExportFrameworkAgreementAuditHistoryCsv } from "@/features/frameworkAgreements/hooks/useExportFrameworkAgreementAuditHistoryCsv"
import { FAEventTypeFilterSchema } from "@/features/frameworkAgreements/api/schema"
import type {
  FAAuditEventResponse,
  FAEventTypeFilter,
} from "@/features/frameworkAgreements/api/schema"
import { ApiError } from "@/lib/api"
import { formatDateTime } from "@/lib/formatters"
import type { UserRole } from "@/features/users/types"

const AUDIT_HISTORY_PAGE_SIZE = 50

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
  const [search, setSearch] = useState("")
  const [eventTypeFilters, setEventTypeFilters] = useState<FAEventTypeFilter[]>(
    []
  )
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)
  const [asOfInput, setAsOfInput] = useState("")
  const [submittedAsOf, setSubmittedAsOf] = useState<string | null>(null)
  const [exportReason, setExportReason] = useState("")

  const reasonRequired = currentUserRole === "back_office"

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
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
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
          ...(fromDate ? { from: fromDate } : {}),
          ...(toDate ? { to: toDate } : {}),
          ...(exportReason.trim() ? { reason: exportReason.trim() } : {}),
        },
      },
      {
        onSuccess: blob => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `fa-audit-${frameworkAgreementId}.csv`
          link.click()
          URL.revokeObjectURL(url)
        },
        onError: err => {
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")
          )
        },
      }
    )
  }

  const hasActiveFilters = eventTypeFilters.length > 0 || !!fromDate || !!toDate

  return (
    <div
      className="flex flex-col gap-4 mt-4"
      data-testid="fa-audit-history-tab"
    >
      <div className="flex items-center gap-6 flex-wrap">
        <SearchInput
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
              {FAEventTypeFilterSchema.options.map(type => {
                const checked = eventTypeFilters.includes(type)
                return (
                  <Button
                    key={type}
                    variant="ghost"
                    onClick={() => toggleEventType(type)}
                    className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
                    data-testid={`audit-filter-event-type-${type}`}
                  >
                    <span
                      className={`shrink-0 size-4 rounded border flex items-center justify-center transition-colors ${
                        checked ? "bg-primary border-primary" : "border-border"
                      }`}
                    >
                      {checked && <Check size={10} className="text-white" />}
                    </span>
                    <span className="text-sm text-foreground">
                      {t(
                        `auditHistory.eventTypes.${type}` as "auditHistory.eventTypes.edited",
                        { defaultValue: type }
                      )}
                    </span>
                  </Button>
                )
              })}
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
              <div className="flex gap-2">
                <DatePicker
                  value={fromDate ?? undefined}
                  onChange={v => setFromDate(v)}
                  placeholder={t("auditHistory.from")}
                  maxDate={new Date()}
                />
                <DatePicker
                  value={toDate ?? undefined}
                  onChange={v => setToDate(v)}
                  placeholder={t("auditHistory.to")}
                  maxDate={new Date()}
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

      <SectionCard title={t("auditHistory.reconstructTitle")}>
        <div className="flex items-end gap-2 flex-wrap">
          <Input
            type="datetime-local"
            value={asOfInput}
            onChange={e => setAsOfInput(e.target.value)}
            max={new Date().toISOString().slice(0, 16)}
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
          <p className="text-sm text-muted-foreground">…</p>
        )}
        {reconstructQuery.isError && (
          <p className="text-sm text-destructive">
            {reconstructQuery.error instanceof ApiError
              ? t(`errors.${reconstructQuery.error.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")}
          </p>
        )}
        {reconstructQuery.data && (
          <div
            className="flex flex-col gap-2 rounded-lg border border-border p-3"
            data-testid="audit-reconstruct-state"
          >
            <p className="text-xs text-muted-foreground">
              {t("auditHistory.eventsReplayed", {
                count: reconstructQuery.data.events_replayed,
              })}
            </p>
            {Object.entries(reconstructQuery.data.state).map(
              ([field, value]) => (
                <div key={field} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{field}:</span>
                  <span className="text-foreground">
                    {formatDiffValue(value)}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </SectionCard>

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

        {isLoading && <div className="h-48 animate-pulse bg-muted rounded" />}

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
    </div>
  )
}

export { AuditHistoryTab }
