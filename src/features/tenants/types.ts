import type { UserRole } from "@/features/users/types"

export const TENANT_LIST_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "support_user",
]

// bank_power_user is read-only on its **own** tenant only (US 29.4 permission matrix:
// "R (own tenant)" for Identity & Status + Module Profile). The route guard can only
// check the role; TenantDetailPage narrows it to the caller's own tenant, and the
// backend returns 404 for any other one (`shared/tenant/dependencies.py`).
export const TENANT_DETAIL_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "support_user",
  "auditor",
  "bank_power_user",
]

export const TENANT_CREATE_ALLOWED_ROLES: readonly UserRole[] = ["system_admin"]
