import {
  AUDITOR_ROLE,
  BANK_POWER_USER_ROLE,
  SYSTEM_ADMIN_ROLE,
} from "@/features/users/types"
import type { UserRole } from "@/features/users/types"

// Backend grants AUDIT_READ to system_admin, auditor, and bank_power_user; support_user is excluded
export const AUDIT_TRAIL_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  AUDITOR_ROLE,
  BANK_POWER_USER_ROLE,
]

export function canAccessAuditTrail(role: UserRole | undefined): boolean {
  return role !== undefined && AUDIT_TRAIL_ALLOWED_ROLES.includes(role)
}

export type AuditFilterState = {
  event_type: string[]
  entity_type: string | null
  entity_id: string | null
  actor_id: string | null
  action_type: string | null
  trigger_source: string | null
  sensitive: boolean | null
  from_dt: string | null
  to_dt: string | null
  // Read from the URL and carried in filter state, but deliberately NOT passed to
  // `useAuditEvents`: GET /audit/events accepts no tenant_id (verified against
  // openapi.json). Sending it through the hook only changed the query key, so the filter
  // appeared to work while the request went out unscoped. system_admin only, once the
  // backend supports it.
  tenant_id: string | null
}

export const EMPTY_AUDIT_FILTER_STATE: AuditFilterState = {
  event_type: [],
  entity_type: null,
  entity_id: null,
  actor_id: null,
  action_type: null,
  trigger_source: null,
  sensitive: null,
  from_dt: null,
  to_dt: null,
  tenant_id: null,
}
