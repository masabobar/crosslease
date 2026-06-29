import type { UserRole } from "@/features/users/types"

// Backend grants AUDIT_READ only to system_admin and auditor; support_user is excluded
export const AUDIT_TRAIL_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "auditor",
]

// Only system_admin sees the Tenant filter — auditor is scoped to their tenant by the backend
export const AUDIT_TENANT_VISIBLE_ROLES: readonly UserRole[] = ["system_admin"]

export type AuditFilterState = {
  search: string | null
  event_type: string[]
  entity_type: string | null
  entity_id: string | null
  actor_id: string | null
  action_type: string | null
  trigger_source: string | null
  sensitive: boolean | null
  from_dt: string | null
  to_dt: string | null
  // UI ready — no tenant_id param in the audit API; system_admin only
  tenant_id: string | null
}

export const EMPTY_AUDIT_FILTER_STATE: AuditFilterState = {
  search: null,
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

export type AuditFilterVisibility = {
  tenant: boolean
}

export function getAuditFilterVisibility(
  viewerRole: UserRole | null | undefined
): AuditFilterVisibility {
  return {
    tenant: !!viewerRole && AUDIT_TENANT_VISIBLE_ROLES.includes(viewerRole),
  }
}
