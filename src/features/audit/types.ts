import type { UserRole } from "@/features/users/types"

export const AUDIT_TRAIL_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "support_user",
  "auditor",
]

// Only system_admin sees the Tenant filter — auditor and support_user are already scoped by the backend
export const AUDIT_TENANT_VISIBLE_ROLES: readonly UserRole[] = ["system_admin"]

export type AuditFilterState = {
  search: string | null
  event_type: string[]
  entity_id: string | null
  actor_id: string | null
  from_dt: string | null
  to_dt: string | null
  result: string | null
  // UI ready — no tenant_id param in the audit API; system_admin only
  tenant_id: string | null
}

export const EMPTY_AUDIT_FILTER_STATE: AuditFilterState = {
  search: null,
  event_type: [],
  entity_id: null,
  actor_id: null,
  from_dt: null,
  to_dt: null,
  result: null,
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
