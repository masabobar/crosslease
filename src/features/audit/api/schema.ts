import { z } from "zod"

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  audit_seq: z.number().int(),
  entity_type: z.string(),
  entity_id: z.string().uuid().nullable(),
  entity_display: z.string().nullable(),
  action_type: z.string(),
  event_type: z.string(),
  actor_id: z.string(),
  actor_display: z.string().nullable(),
  actor_type: z.string(),
  old_data: z.record(z.string(), z.unknown()).nullable(),
  new_data: z.record(z.string(), z.unknown()).nullable(),
  changed_fields: z.array(z.string()).nullable(),
  trigger_source: z.string().nullable(),
  reason: z.string().nullable(),
  comment: z.string().nullable(),
  tenant_id: z.string().uuid().nullable(),
  correlation_id: z.string().nullable(),
  session_id: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()).nullable(),
  sensitive: z.boolean(),
  recorded_at: z.string(),
})
export type AuditEvent = z.infer<typeof AuditEventSchema>

export const PaginatedAuditEventsSchema = z.object({
  events: z.array(AuditEventSchema),
  total: z.number().int(),
  page: z.number().int(),
  per_page: z.number().int(),
  total_pages: z.number().int(),
})
export type PaginatedAuditEvents = z.infer<typeof PaginatedAuditEventsSchema>

export const AUDIT_EVENT_TYPES = [
  // Auth
  "auth.login_success",
  "auth.login_failed",
  "auth.login_locked",
  "auth.otp_failed",
  "auth.otp_max_attempts",
  "auth.logout",
  "auth.logout_all",
  "auth.password_reset_requested",
  "auth.password_reset_completed",
  // Security
  "security.permission_denied",
  "security.cross_tenant_attempt",
  // User lifecycle
  "user.activated",
  "user.role_changed",
  "user.invite_resent",
  "user.invite_initiated",
  "user.invited",
  "user.invite_approved",
  "user.invite_rejected",
  "user.invite_expired",
  "user.invite_reinitiated",
  "user.suspended",
  "user.suspension_scheduled",
  "user.suspension_applied",
  "user.suspension_expired",
  "user.reactivated",
  "user.deactivated",
  "user.deactivation_scheduled",
  "user.deactivation_applied",
  "user.access_expired",
  "user.list_exported",
] as const

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number]

export type AuditResult = "Success" | "Failed"

const FAILED_SUFFIXES = ["_failed", "_denied", "_rejected", "_violation"]

export function deriveAuditResult(eventType: string): AuditResult {
  const lower = eventType.toLowerCase()
  return FAILED_SUFFIXES.some(s => lower.includes(s)) ? "Failed" : "Success"
}

export type AuditQueryParams = {
  search?: string | null
  event_type?: string[]
  entity_type?: string | null
  entity_id?: string | null
  actor_id?: string | null
  action_type?: string | null
  trigger_source?: string | null
  sensitive?: boolean | null
  result?: string | null
  tenant_id?: string | null
  from_dt?: string | null
  to_dt?: string | null
  page?: number
  per_page?: number
}
