import {
  AUDITOR_ROLE,
  BANK_POWER_USER_ROLE,
  SUPPORT_USER_ROLE,
  SYSTEM_ADMIN_ROLE,
} from "@/features/users/types"
import type { UserRole } from "@/features/users/types"

export const TENANT_LIST_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  SUPPORT_USER_ROLE,
]

// bank_power_user is read-only on its **own** tenant only (US 29.4 permission matrix:
// "R (own tenant)" for Identity & Status + Module Profile). The route guard can only
// check the role; TenantDetailPage narrows it to the caller's own tenant, and the
// backend returns 404 for any other one (`shared/tenant/dependencies.py`).
export const TENANT_DETAIL_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  SUPPORT_USER_ROLE,
  AUDITOR_ROLE,
  BANK_POWER_USER_ROLE,
]

export const TENANT_CREATE_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
]
