import { UpdateTaskRequestSchema } from "@/features/workflowTaskCatalog/api/schema"
import type {
  AuditTrailEventItem,
  UpdateTaskRequest,
} from "@/features/workflowTaskCatalog/api/schema"

// Derived from the schema rather than hand-listed, so it cannot drift from UpdateTaskRequest.
const UPDATE_TASK_WIRE_FIELDS = Object.keys(UpdateTaskRequestSchema.shape)

/**
 * Reduce a task payload to the fields a PATCH may carry.
 *
 * `layer_action`, `task_code` and `parent_task_id` are immutable once a task is created and are
 * omitted from `UpdateTaskRequest`. The sheet builds ONE payload for both create and edit, so at
 * runtime those keys are still present on the edit path — and the `UpdateTaskRequest` type
 * annotation cannot remove them, because TypeScript's excess-property check does not apply to a
 * variable. Without this they go over the wire on every edit; the BE ignores them (its model has
 * no `extra="forbid"`), so it fails silently rather than loudly.
 *
 * Strips, and deliberately does **not** validate. Out-of-range values must still reach the BE so
 * its `VALIDATION_ERROR` can be mapped onto the offending form field by `applyApiFieldErrors`.
 * `UpdateTaskRequestSchema.parse()` here would instead throw a ZodError that is not an `ApiError`,
 * turning an inline field error into a generic toast — `task_name` has `.max(300)` in the schema
 * and no `maxlength` on the input, so that path is reachable.
 */
export function toUpdateTaskBody(
  payload: UpdateTaskRequest
): UpdateTaskRequest {
  return Object.fromEntries(
    Object.entries(payload).filter(([field]) =>
      UPDATE_TASK_WIRE_FIELDS.includes(field)
    )
  ) as UpdateTaskRequest
}

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
