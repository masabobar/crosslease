// Display metadata for the registered EventType catalogue (see ../../../refinext-api
// src/app/modules/notifications/domain/enums.py). The API returns only the raw wire
// values; title/group labels are FE-owned i18n presentation, not business data.
// Event types not present in this map render with a raw-value fallback (see
// getEventTypeDisplay) rather than being dropped, so a future BE addition degrades
// gracefully instead of disappearing silently.
type EventTypeDisplayEntry = {
  titleKey: `eventType.${string}`
  groupKey: `group.${string}`
}

export const EVENT_TYPE_DISPLAY: Record<string, EventTypeDisplayEntry> = {
  "task.assigned": {
    titleKey: "eventType.taskAssigned",
    groupKey: "group.workflow",
  },
  "task.reassigned": {
    titleKey: "eventType.taskReassigned",
    groupKey: "group.workflow",
  },
  "task.rework_requested": {
    titleKey: "eventType.taskReworkRequested",
    groupKey: "group.workflow",
  },
  "task.escalated": {
    titleKey: "eventType.taskEscalated",
    groupKey: "group.workflow",
  },
  "request.approved": {
    titleKey: "eventType.requestApproved",
    groupKey: "group.financing",
  },
  "request.rejected": {
    titleKey: "eventType.requestRejected",
    groupKey: "group.financing",
  },
  "disbursement.confirmed": {
    titleKey: "eventType.disbursementConfirmed",
    groupKey: "group.disbursement",
  },
  "disbursement.failed": {
    titleKey: "eventType.disbursementFailed",
    groupKey: "group.disbursement",
  },
  "condition.overdue": {
    titleKey: "eventType.conditionOverdue",
    groupKey: "group.conditions",
  },
  "fa.suspended": {
    titleKey: "eventType.faSuspended",
    groupKey: "group.frameworkAgreements",
  },
  "fa.reactivated": {
    titleKey: "eventType.faReactivated",
    groupKey: "group.frameworkAgreements",
  },
  "fa.terminated": {
    titleKey: "eventType.faTerminated",
    groupKey: "group.frameworkAgreements",
  },
  "fa.edited": {
    titleKey: "eventType.faEdited",
    groupKey: "group.frameworkAgreements",
  },
}

export function getEventTypeDisplay(eventType: string): {
  titleKey: `eventType.${string}` | null
  groupKey: `group.${string}` | null
  fallback: string
} {
  const entry = EVENT_TYPE_DISPLAY[eventType]
  return {
    titleKey: entry?.titleKey ?? null,
    groupKey: entry?.groupKey ?? null,
    fallback: eventType,
  }
}
