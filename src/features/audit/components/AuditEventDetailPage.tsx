import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { Copy, Check, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { useAuditEventDetail } from "@/features/audit/hooks/useAuditEventDetail"
import {
  formatEventType,
  formatActionType,
  formatDateTime,
} from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { COPIED_RESET_DELAY_MS } from "@/lib/constants"
import type { AuditEvent } from "@/features/audit/api/schema"

type Tab = "overview" | "actor" | "payload"

// ── Shared primitives ────────────────────────────────────────────────────────

function EntityTypeBadge({ entityType }: { entityType: string }) {
  return (
    <span className="inline-flex items-center h-[18px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium leading-4 whitespace-nowrap">
      {formatActionType(entityType)}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation("audit")
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), COPIED_RESET_DELAY_MS)
    })
  }

  return (
    // NOTE: raw <button> — icon-only copy trigger nested inside a grid cell; shadcn Button adds padding/height that distorts the cell layout
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      title={copied ? t("drawer.copied") : undefined}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

type InfoCardProps = {
  title: string
  children: React.ReactNode
}

function InfoCard({ title, children }: InfoCardProps) {
  return (
    <div className="rounded-[10px] border border-border bg-slate-100 shrink-0 w-full">
      <div className="px-2 h-10 flex items-center">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="bg-background border border-border rounded-[10px] p-2">
        {children}
      </div>
    </div>
  )
}

type FieldRowProps = {
  label: string
  children: React.ReactNode
}

function FieldRow({ label, children }: FieldRowProps) {
  return (
    <div className="flex gap-4 items-start min-h-5">
      <span className="w-[120px] shrink-0 text-sm text-muted-foreground leading-5">
        {label}
      </span>
      <div className="flex-1 min-w-0 text-sm text-foreground leading-5">
        {children}
      </div>
    </div>
  )
}

function FieldRows({
  rows,
}: {
  rows: { label: string; value: React.ReactNode }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ label, value }, i) => (
        <FieldRow key={i} label={label}>
          {value}
        </FieldRow>
      ))}
    </div>
  )
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function extractPrimaryStateValue(
  data: Record<string, unknown> | null,
  changedFields: string[] | null
): string | null {
  if (!data || !changedFields?.length) return null
  const field = changedFields[0]
  const val = data[field]
  if (val === null || val === undefined) return null
  if (typeof val === "string") return formatActionType(val)
  return String(val)
}

function StateChangeCard({ event }: { event: AuditEvent }) {
  const { t } = useTranslation("audit")

  const hasContent =
    (event.changed_fields && event.changed_fields.length > 0) ||
    event.reason ||
    event.old_data ||
    event.new_data

  if (!hasContent) return null

  const oldValue = extractPrimaryStateValue(
    event.old_data,
    event.changed_fields
  )
  const newValue = extractPrimaryStateValue(
    event.new_data,
    event.changed_fields
  )

  return (
    <InfoCard title={t("drawer.sections.stateChange")}>
      <div className="flex flex-col gap-3">
        {event.changed_fields && event.changed_fields.length > 0 && (
          <FieldRow label={t("drawer.fields.changedFields")}>
            <span className="font-semibold">
              {event.changed_fields.map(formatActionType).join(", ")}
            </span>
          </FieldRow>
        )}
        {event.reason !== undefined && (
          <FieldRow label={t("drawer.fields.reason")}>
            {event.reason ?? "—"}
          </FieldRow>
        )}
        {event.comment !== undefined && (
          <FieldRow label={t("drawer.fields.comment")}>
            {event.comment ?? "—"}
          </FieldRow>
        )}

        {(event.old_data || event.new_data) && (
          <div className="border-t border-border pt-4 mt-1 flex items-start gap-2">
            {event.old_data && (
              <div className="flex-1 min-w-0 bg-destructive/10 border border-destructive/50 rounded-[10px] px-4 py-3">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
                  {t("drawer.fields.oldState")}
                </p>
                <p className="text-sm text-destructive mt-1">
                  {oldValue ?? JSON.stringify(event.old_data)}
                </p>
              </div>
            )}
            {event.old_data && event.new_data && (
              <div className="shrink-0 self-center">
                <ArrowRight size={16} className="text-muted-foreground" />
              </div>
            )}
            {event.new_data && (
              <div className="flex-1 min-w-0 bg-green-50 border border-green-500/50 rounded-[10px] px-4 py-3">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  {t("drawer.fields.newState")}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {newValue ?? JSON.stringify(event.new_data)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </InfoCard>
  )
}

function TimingCard({ event }: { event: AuditEvent }) {
  const { t } = useTranslation("audit")

  const effectiveFrom =
    (event.new_data?.access_valid_from as string | undefined) ??
    (event.payload?.access_valid_from as string | undefined)
  const effectiveUntil =
    (event.new_data?.access_valid_until as string | undefined) ??
    (event.payload?.access_valid_until as string | undefined)

  if (!effectiveFrom && !effectiveUntil) return null

  return (
    <InfoCard title={t("drawer.sections.timing")}>
      <FieldRows
        rows={[
          ...(effectiveFrom
            ? [
                {
                  label: t("drawer.fields.effectiveFrom"),
                  value: formatDateTime(effectiveFrom),
                },
              ]
            : []),
          ...(effectiveUntil
            ? [
                {
                  label: t("drawer.fields.effectiveUntil"),
                  value: formatDateTime(effectiveUntil),
                },
              ]
            : []),
        ]}
      />
    </InfoCard>
  )
}

function OverviewTab({ event }: { event: AuditEvent }) {
  const { t } = useTranslation("audit")

  const eventFields = [
    { label: t("drawer.fields.auditId"), value: event.id },
    {
      label: t("drawer.fields.auditSeq"),
      value: `#${event.audit_seq}`,
    },
    {
      label: t("drawer.fields.eventType"),
      value: formatEventType(event.event_type),
    },
    {
      label: t("drawer.fields.actionType"),
      value: formatActionType(event.action_type),
    },
    {
      label: t("drawer.fields.triggerSource"),
      value: event.trigger_source
        ? formatActionType(event.trigger_source)
        : "—",
    },
    {
      label: t("drawer.fields.recordedAt"),
      value: formatDateTime(event.recorded_at),
    },
    {
      label: t("drawer.fields.sensitive"),
      value: event.sensitive
        ? t("drawer.fields.sensitiveYes")
        : t("drawer.fields.sensitiveNo"),
    },
  ]

  return (
    <div className="flex gap-6 items-start">
      {/* Left column */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <InfoCard title={t("drawer.sections.event")}>
          <FieldRows rows={eventFields} />
        </InfoCard>
        <StateChangeCard event={event} />
      </div>

      {/* Right column */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <InfoCard title={t("drawer.sections.entityAndContext")}>
          <div className="flex flex-col gap-3">
            <FieldRow label={t("drawer.fields.entityType")}>
              <EntityTypeBadge entityType={event.entity_type} />
            </FieldRow>
            <FieldRow label={t("drawer.fields.entity")}>
              <div className="flex flex-col gap-0.5">
                <span>{event.entity_display ?? "—"}</span>
                {event.entity_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {event.entity_id}
                    </span>
                    <CopyButton text={event.entity_id} />
                  </div>
                )}
              </div>
            </FieldRow>
            <FieldRow label={t("drawer.fields.tenant")}>
              {event.tenant_id ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {event.tenant_id}
                  </span>
                  <CopyButton text={event.tenant_id} />
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </FieldRow>
            <FieldRow label={t("drawer.fields.correlationId")}>
              {event.correlation_id ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {event.correlation_id}
                  </span>
                  <CopyButton text={event.correlation_id} />
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </FieldRow>
          </div>
        </InfoCard>
        <TimingCard event={event} />
      </div>
    </div>
  )
}

// ── Tab: Actor ────────────────────────────────────────────────────────────────

function ActorTab({ event }: { event: AuditEvent }) {
  const { t } = useTranslation("audit")

  const performedByFields = [
    {
      label: t("drawer.fields.name"),
      value: (event.actor_display ?? event.actor_id) as React.ReactNode,
    },
    {
      label: t("drawer.fields.actorType"),
      value: formatActionType(event.actor_type) as React.ReactNode,
    },
    {
      label: t("drawer.fields.roleAtTime"),
      value: (event.actor_role_at_time
        ? formatActionType(event.actor_role_at_time)
        : "—") as React.ReactNode,
    },
    {
      label: t("drawer.fields.actorId"),
      value: (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {event.actor_id}
          </span>
          <CopyButton text={event.actor_id} />
        </div>
      ),
    },
    {
      label: t("drawer.fields.tenant"),
      value: event.tenant_id ? (
        <span className="font-mono text-xs text-muted-foreground">
          {event.tenant_id}
        </span>
      ) : (
        <span className="text-muted-foreground">
          {t("drawer.fields.platformLevel")}
        </span>
      ),
    },
  ]

  const affectedUserFields =
    event.entity_display || event.entity_id
      ? [
          {
            label: t("drawer.fields.user"),
            value: (
              <div className="flex flex-col gap-0.5">
                {event.entity_display && <span>{event.entity_display}</span>}
                {event.entity_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {event.entity_id}
                    </span>
                    <CopyButton text={event.entity_id} />
                  </div>
                )}
              </div>
            ) as React.ReactNode,
          },
          ...(event.tenant_id
            ? [
                {
                  label: t("drawer.fields.tenantId"),
                  value: (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {event.tenant_id}
                      </span>
                      <CopyButton text={event.tenant_id} />
                    </div>
                  ) as React.ReactNode,
                },
              ]
            : []),
        ]
      : [
          {
            label: t("drawer.fields.user"),
            value: "—" as React.ReactNode,
          },
        ]

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1 min-w-0">
        <InfoCard title={t("drawer.sections.performedBy")}>
          <FieldRows rows={performedByFields} />
        </InfoCard>
      </div>
      <div className="flex-1 min-w-0">
        <InfoCard title={t("drawer.sections.affectedUser")}>
          <FieldRows rows={affectedUserFields} />
        </InfoCard>
      </div>
    </div>
  )
}

// ── Tab: Payload ──────────────────────────────────────────────────────────────

function PayloadTab({ event }: { event: AuditEvent }) {
  const { t } = useTranslation("audit")
  const [expanded, setExpanded] = useState(true)

  const payload = event.payload

  return (
    <div className="rounded-[10px] border border-border bg-slate-100 w-full">
      {/* NOTE: raw <button> — full-width collapsible header that composes with custom border-radius and bg; shadcn Collapsible trigger does not expose the same layout control */}
      <button
        type="button"
        className="w-full px-2 h-10 flex items-center justify-between hover:bg-slate-200/50 transition-colors rounded-t-[10px]"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {t("drawer.sections.rawPayload")}{" "}
          <span className="normal-case font-normal text-muted-foreground">
            {t("drawer.sections.rawPayloadSub")}
          </span>
        </span>
        {expanded ? (
          <ChevronUp size={16} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="bg-background border border-border rounded-b-[10px] p-2">
          {payload ? (
            <pre className="text-xs font-mono overflow-auto max-h-[500px] whitespace-pre-wrap break-all text-foreground">
              {JSON.stringify(payload, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground py-2 px-1">
              {t("drawer.noPayload")}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-8 bg-muted rounded animate-pulse w-56" />
      <div className="h-5 bg-muted rounded animate-pulse w-72" />
      <div className="h-px bg-border" />
      <div className="flex gap-6">
        {[0, 1].map(col => (
          <div key={col} className="flex-1 flex flex-col gap-4">
            <div className="rounded-[10px] border border-border bg-slate-100">
              <div className="h-10" />
              <div className="bg-background border border-border rounded-[10px] p-4 space-y-3">
                {Array.from({ length: 6 }, (_, j) => (
                  <div
                    key={j}
                    className="h-4 bg-muted rounded animate-pulse"
                    style={{ width: `${48 + (j % 3) * 16}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { t } = useTranslation("audit")
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const {
    data: event,
    isLoading,
    isError,
  } = useAuditEventDetail(eventId ?? null)

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: t("drawer.tabs.overview") },
    { key: "actor", label: t("drawer.tabs.actor") },
    { key: "payload", label: t("drawer.tabs.payload") },
  ]

  return (
    <div className="p-8" data-testid="audit-event-detail-page">
      {isLoading && <DetailSkeleton />}

      {isError && !isLoading && (
        <p className="text-sm text-muted-foreground">{t("drawer.loadError")}</p>
      )}

      {event && !isLoading && (
        <div className="flex flex-col">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {formatEventType(event.event_type)}
            </h1>
            {event.entity_display && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatEventType(event.event_type)}{" "}
                {t("drawer.fields.userAffected").toLowerCase()}{" "}
                <span className="font-semibold text-foreground">
                  {event.entity_display}
                </span>
              </p>
            )}
          </div>

          {/* Tab bar */}
          {/* NOTE: raw <button> — custom underline-tab style uses -mb-px trick that conflicts with shadcn Tabs DOM structure */}
          <div className="mt-6 border-b border-border flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                data-testid={`audit-detail-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "pb-3 pt-0.5 px-1.5 text-sm font-medium leading-5 whitespace-nowrap transition-colors",
                  activeTab === tab.key
                    ? "border-b-2 border-primary text-foreground -mb-px"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-6">
            {activeTab === "overview" && <OverviewTab event={event} />}
            {activeTab === "actor" && <ActorTab event={event} />}
            {activeTab === "payload" && <PayloadTab event={event} />}
          </div>
        </div>
      )}
    </div>
  )
}
