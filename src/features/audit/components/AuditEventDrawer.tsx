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
import { AuditResultBadge } from "@/features/audit/components/AuditResultBadge"
import { useAuditEventDetail } from "@/features/audit/hooks/useAuditEventDetail"
import { deriveAuditResult } from "@/features/audit/api/schema"
import {
  formatEventType,
  formatActionType,
  formatDateTime,
} from "@/lib/formatters"
import type { AuditEvent } from "@/features/audit/api/schema"

type AuditEventDrawerProps = {
  eventId: string | null
  onClose: () => void
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

function StackedValue({
  primary,
  secondary,
}: {
  primary: string
  secondary?: string
}) {
  return (
    <div className="flex flex-col gap-px">
      <span>{primary}</span>
      {secondary && <span className="text-muted-foreground">{secondary}</span>}
    </div>
  )
}

function DrawerContent({ event }: { event: AuditEvent }) {
  const { t } = useTranslation("audit")
  const result = deriveAuditResult(event.event_type)

  const summaryFields: { label: string; value: ReactNode }[] = [
    {
      label: t("drawer.fields.timestamp"),
      value: formatDateTime(event.recorded_at),
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
      label: t("drawer.fields.userAffected"),
      value: event.entity_display ?? "—",
    },
    {
      label: t("drawer.fields.performedBy"),
      value: (
        <StackedValue
          primary={event.actor_id}
          secondary={formatActionType(event.actor_type)}
        />
      ),
    },
    {
      label: t("drawer.fields.tenant"),
      value: event.tenant_id ?? "—",
    },
    {
      label: t("drawer.fields.result"),
      value: <AuditResultBadge result={result} />,
    },
  ]

  const technicalFields: { label: string; value: ReactNode }[] = [
    {
      label: t("drawer.fields.auditSeq"),
      value: String(event.audit_seq),
    },
    {
      label: t("drawer.fields.reason"),
      value: event.reason ?? "—",
    },
    {
      label: t("drawer.fields.comment"),
      value: event.comment ?? "—",
    },
    {
      label: t("drawer.fields.triggerSource"),
      value: event.trigger_source
        ? formatActionType(event.trigger_source)
        : "—",
    },
    ...(event.changed_fields && event.changed_fields.length > 0
      ? [
          {
            label: t("drawer.fields.changedFields"),
            value: event.changed_fields.map(formatActionType).join(", "),
          },
        ]
      : []),
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
      value: event.sensitive
        ? t("drawer.fields.sensitiveYes")
        : t("drawer.fields.sensitiveNo"),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <SheetTitle className="text-base font-semibold text-foreground">
          {t("drawer.title")}
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

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-4">
        <InfoCard title={t("drawer.sections.summary")} fields={summaryFields} />
        <InfoCard
          title={t("drawer.sections.technicalReference")}
          fields={technicalFields}
        />
      </div>
    </div>
  )
}

export function AuditEventDrawer({ eventId, onClose }: AuditEventDrawerProps) {
  const { t } = useTranslation("audit")
  const { data: event, isLoading, isError } = useAuditEventDetail(eventId)

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
            <div className="flex items-center justify-between px-3 py-2 shrink-0">
              <div className="h-5 bg-muted rounded animate-pulse w-32" />
            </div>
            <div className="flex-1 px-3 pb-4 flex flex-col gap-4">
              {[6, 7].map((rows, i) => (
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
              {t("drawer.loadError")}
            </p>
          </div>
        )}

        {event && !isLoading && <DrawerContent event={event} />}
      </SheetContent>
    </Sheet>
  )
}
