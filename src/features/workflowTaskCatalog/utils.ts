import type { AuditTrailEventItem } from "@/features/workflowTaskCatalog/api/schema"

export type TaskFieldChange = {
  field: string
  before: unknown
  after: unknown
}

function isSameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/**
 * Derive which fields an audit event actually changed.
 *
 * The catalogue audit endpoint returns `changed_fields: null` — only the user and tenant
 * lifecycle writers populate it — so the changed set is derived from the payloads the event
 * does carry. `changed_fields` is still honoured when present, but either way the result is
 * filtered to values that genuinely differ, so a declared-but-identical field is not rendered
 * as a change.
 *
 * A create carries no `old_data` and therefore no delta: nothing changed, something began,
 * which the event type already states.
 */
export function deriveFieldDelta(
  event: AuditTrailEventItem
): TaskFieldChange[] {
  const before = event.old_data
  const after = event.new_data
  if (!before || !after) return []

  const fields = event.changed_fields ?? Object.keys({ ...before, ...after })

  return fields
    .map(field => ({ field, before: before[field], after: after[field] }))
    .filter(change => !isSameValue(change.before, change.after))
}
