import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { XIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api"
import { AuditResultBadge } from "@/features/audit/components/AuditResultBadge"
import { EntityTypeBadge } from "@/features/audit/components/EntityTypeBadge"
import { useAuditEventDetail } from "@/features/audit/hooks/useAuditEventDetail"
import { useAuditEventLabels } from "@/features/audit/hooks/useAuditEventLabels"
import { deriveAuditResult } from "@/features/audit/api/schema"
import { formatEventType } from "@/lib/formatters"
import type { AuditEvent, AuditResult } from "@/features/audit/api/schema"

type DrawerTab = "overview" | "actor" | "payload"

type AuditEventDrawerProps = {
  eventId: string | null
  onClose: () => void
}

function TabButton({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  testId?: string
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      data-testid={testId}
      className={`h-auto px-1.5 py-1 rounded-none border-none text-sm font-medium hover:bg-transparent focus-visible:ring-0 focus-visible:border-none ${
        active
          ? "text-foreground hover:text-foreground"
          : "text-foreground/60 hover:text-foreground/80"
      }`}
    >
      {children}
    </Button>
  )
}

function InfoCard({
  title,
  fields,
}: {
  title: string
  fields: { label: string; value: ReactNode }[]
}) {
  return (
    <div className="rounded-[10px] border border-border bg-slate-100 shrink-0">
      <div className="px-2 h-8 flex items-center">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="bg-background border border-border rounded-[10px] p-2 flex flex-col gap-3">
        {fields.map(({ label, value }, i) => (
          <div key={i} className="flex gap-4 items-start">
            <span className="w-[110px] shrink-0 text-sm text-muted-foreground leading-5">
              {label}
            </span>
            <div className="flex-1 min-w-0 text-sm text-foreground leading-5 break-all">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StateChanges({
  oldData,
  newData,
}: {
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
}) {
  const { t } = useTranslation("audit")
  if (!oldData && !newData) return null

  return (
    <div className="rounded-[10px] border border-border bg-slate-100 shrink-0">
      <div className="px-2 h-8 flex items-center">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {t("drawer.sections.stateChange")}
        </span>
      </div>
      <div className="bg-background border border-border rounded-[10px] p-2 flex gap-2">
        {oldData && (
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-muted-foreground">
              {t("drawer.fields.oldState")}
            </span>
            <pre className="mt-1 text-xs bg-destructive/10 border border-destructive/20 rounded-md p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all">
              {JSON.stringify(oldData, null, 2)}
            </pre>
          </div>
        )}
        {newData && (
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-muted-foreground">
              {t("drawer.fields.newState")}
            </span>
            <pre className="mt-1 text-xs bg-green-50 border border-green-200 rounded-md p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all">
              {JSON.stringify(newData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

function OverviewTab({
  event,
  result,
}: {
  event: AuditEvent
  result: AuditResult
}) {
  const { t } = useTranslation("audit")
  const { eventTypeLabel, actionTypeLabel, recordedAtLabel, sensitiveLabel } =
    useAuditEventLabels(event)

  const summaryFields: { label: string; value: ReactNode }[] = [
    {
      label: t("drawer.fields.recordedAt"),
      value: recordedAtLabel,
    },
    {
      label: t("drawer.fields.eventType"),
      value: eventTypeLabel,
    },
    {
      label: t("drawer.fields.actionType"),
      value: actionTypeLabel,
    },
    {
      label: t("drawer.fields.entityType"),
      value: <EntityTypeBadge entityType={event.entity_type} />,
    },
    {
      label: t("drawer.fields.userAffected"),
      value: event.entity_display ?? "—",
    },
    {
      label: t("drawer.fields.tenant"),
      value: event.tenant_id ?? "—",
    },
    {
      label: t("drawer.fields.result"),
      value: <AuditResultBadge result={result} />,
    },
    {
      label: t("drawer.fields.auditSeq"),
      value: String(event.audit_seq),
    },
    {
      label: t("drawer.fields.correlationId"),
      value: event.correlation_id ?? "—",
    },
    {
      label: t("drawer.fields.sessionId"),
      value: event.session_id ?? "—",
    },
    {
      label: t("drawer.fields.sensitive"),
      value: sensitiveLabel,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title={t("drawer.sections.event")} fields={summaryFields} />
      <StateChanges oldData={event.old_data} newData={event.new_data} />
    </div>
  )
}

function ActorTab({ event }: { event: AuditEvent }) {
  const { t } = useTranslation("audit")
  const {
    actorTypeLabel,
    roleAtTimeLabel,
    triggerSourceLabel,
    reasonLabel,
    commentLabel,
    changedFieldsLabel,
  } = useAuditEventLabels(event)

  const actorFields: { label: string; value: ReactNode }[] = [
    {
      label: t("drawer.fields.actorId"),
      value: event.actor_id,
    },
    {
      label: t("drawer.fields.actorType"),
      value: actorTypeLabel,
    },
    {
      label: t("drawer.fields.roleAtTime"),
      value: roleAtTimeLabel,
    },
    {
      label: t("drawer.fields.triggerSource"),
      value: triggerSourceLabel,
    },
    {
      label: t("drawer.fields.reason"),
      value: reasonLabel,
    },
    {
      label: t("drawer.fields.comment"),
      value: commentLabel,
    },
    ...(changedFieldsLabel
      ? [
          {
            label: t("drawer.fields.changedFields"),
            value: changedFieldsLabel,
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title={t("drawer.sections.performedBy")} fields={actorFields} />
    </div>
  )
}

function PayloadTab({ event }: { event: AuditEvent }) {
  const { t } = useTranslation("audit")

  if (!event.payload) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">{t("drawer.noPayload")}</p>
      </div>
    )
  }

  return (
    <div className="rounded-[10px] border border-border bg-slate-100 shrink-0">
      <div className="px-2 h-8 flex items-center">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {t("drawer.sections.rawPayload")}
        </span>
      </div>
      <div className="bg-background border border-border rounded-[10px] p-2">
        <pre className="text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap break-all">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function DrawerContent({ event }: { event: AuditEvent }) {
  const { t } = useTranslation("audit")
  const result = deriveAuditResult(event.event_type, event.action_type)
  const [tab, setTab] = useState<DrawerTab>("overview")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-0 shrink-0">
        <div className="flex items-center justify-between">
          <SheetTitle className="text-base font-semibold text-foreground">
            {formatEventType(event.event_type)}
          </SheetTitle>
          <SheetClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground"
                data-testid="audit-drawer-close"
              />
            }
          >
            <XIcon className="size-4" />
          </SheetClose>
        </div>
        {event.entity_display && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {event.entity_display}
          </p>
        )}
        <div className="flex items-center gap-0 mt-2 border-b border-border">
          <TabButton
            active={tab === "overview"}
            onClick={() => setTab("overview")}
            testId="audit-tab-overview"
          >
            {t("drawer.tabs.overview")}
          </TabButton>
          <TabButton
            active={tab === "actor"}
            onClick={() => setTab("actor")}
            testId="audit-tab-actor"
          >
            {t("drawer.tabs.actor")}
          </TabButton>
          <TabButton
            active={tab === "payload"}
            onClick={() => setTab("payload")}
            testId="audit-tab-payload"
          >
            {t("drawer.tabs.payload")}
          </TabButton>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-4 flex flex-col gap-4">
        {tab === "overview" && <OverviewTab event={event} result={result} />}
        {tab === "actor" && <ActorTab event={event} />}
        {tab === "payload" && <PayloadTab event={event} />}
      </div>
    </div>
  )
}

export function AuditEventDrawer({ eventId, onClose }: AuditEventDrawerProps) {
  const { t } = useTranslation("audit")
  const {
    data: event,
    isLoading,
    isError,
    error,
  } = useAuditEventDetail(eventId)

  return (
    <Sheet
      open={!!eventId}
      onOpenChange={o => {
        if (!o) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="w-[480px] sm:max-w-[480px] gap-0 p-0 bg-background"
        showCloseButton={false}
        data-testid="audit-event-drawer"
      >
        {isLoading && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-3 py-3 shrink-0">
              <div className="h-5 bg-muted rounded animate-pulse w-40" />
            </div>
            <div className="flex-1 px-3 pb-4 flex flex-col gap-4">
              {[8, 6].map((rows, i) => (
                <div
                  key={i}
                  className="rounded-[10px] border border-border bg-slate-100"
                >
                  <div className="h-8" />
                  <div className="bg-background border border-border rounded-[10px] p-4 space-y-3">
                    {Array.from({ length: rows }, (_, j) => (
                      <div
                        key={j}
                        className="h-4 bg-muted rounded animate-pulse"
                        style={{ width: `${50 + (j % 4) * 12}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex-1 flex items-center justify-center px-4 h-full">
            <p className="text-sm text-muted-foreground text-center">
              {error instanceof ApiError
                ? t(`errors.${error.code}`, {
                    defaultValue: t("errors.generic"),
                  })
                : t("errors.generic")}
            </p>
          </div>
        )}

        {event && !isLoading && <DrawerContent event={event} />}
      </SheetContent>
    </Sheet>
  )
}
