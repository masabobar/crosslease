import { useTranslation } from "react-i18next"
import type { AuditEvent } from "@/features/audit/api/schema"
import {
  formatEventType,
  formatActionType,
  formatDateTime,
} from "@/lib/formatters"

const NOT_AVAILABLE = "—"

/**
 * Shared derived-label computations reused by AuditEventDetailPage and
 * AuditEventDrawer's Overview/Actor tabs. Covers only the field values that are
 * computed identically in both views. The two views still differ in JSX
 * composition (InfoCard/column layout, copy buttons, badges, collapsible
 * payload, and `auditSeq` formatting: `#${n}` on the page vs `String(n)` in the
 * drawer) — those stay local to each file.
 */
export function useAuditEventLabels(event: AuditEvent) {
  const { t } = useTranslation("audit")

  return {
    eventTypeLabel: formatEventType(event.event_type),
    actionTypeLabel: formatActionType(event.action_type),
    recordedAtLabel: formatDateTime(event.recorded_at),
    sensitiveLabel: event.sensitive
      ? t("drawer.fields.sensitiveYes")
      : t("drawer.fields.sensitiveNo"),
    triggerSourceLabel: event.trigger_source
      ? formatActionType(event.trigger_source)
      : NOT_AVAILABLE,
    actorTypeLabel: formatActionType(event.actor_type),
    roleAtTimeLabel: event.actor_role_at_time
      ? formatActionType(event.actor_role_at_time)
      : NOT_AVAILABLE,
    changedFieldsLabel:
      event.changed_fields && event.changed_fields.length > 0
        ? event.changed_fields.map(formatActionType).join(", ")
        : null,
    reasonLabel: event.reason ?? NOT_AVAILABLE,
    commentLabel: event.comment ?? NOT_AVAILABLE,
  }
}
