export const USER_ROLES = [
  "system_admin",
  "support_user",
  "auditor",
  "front_office",
  "back_office",
  "leasing_company_user",
] as const

export type UserRole = (typeof USER_ROLES)[number]

export const FOUR_EYES_ROLES: readonly UserRole[] = [
  "system_admin",
  "support_user",
  "auditor",
]

export const TENANT_SCOPED_ROLES: readonly UserRole[] = [
  "front_office",
  "back_office",
  "leasing_company_user",
]

export const AUDITOR_DATE_RANGE_ROLES: readonly UserRole[] = ["auditor"]

export const READ_ONLY_VIEWER_ROLES: readonly UserRole[] = [
  "support_user",
  "auditor",
]

export const USER_MANAGEMENT_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "support_user",
  "auditor",
]

export const LC_ONLY_ROLES: readonly UserRole[] = ["leasing_company_user"]

// Roles that can use cross-tenant filters (Tenant + LG dropdowns).
// Auditor is excluded: the backend scopes their results to their assigned tenant.
export const TENANT_FILTER_VISIBLE_ROLES: readonly UserRole[] = [
  "system_admin",
  "support_user",
]

// Roles that see governance-related filters (Audit Engagement Status, System User Flag,
// Service Account Flag, Origin Type, Last Role/Permission Change Date).
// Per US-05 v2 filter visibility matrix.
export const GOVERNANCE_FILTER_ROLES: readonly UserRole[] = [
  "system_admin",
  "auditor",
]

export const INTERNAL_BANK_ROLES: readonly UserRole[] = [
  "system_admin",
  "support_user",
  "auditor",
  "front_office",
  "back_office",
]

export const WRITE_ACTION_ROLES: readonly UserRole[] = [
  "system_admin",
  "front_office",
  "back_office",
]

// Roles that must not see sensitive authentication details in the user list
// (MFA status, last login). Per US-04: support users receive only
// "permitted support-level fields" and cannot see auth details.
export const SENSITIVE_AUTH_RESTRICTED_ROLES: readonly UserRole[] = [
  "support_user",
]

// Operational bank-tenant roles — scoped to their own tenant.
// In the user list the Tenant column is redundant for these viewers
// because the backend already filters to their tenant.
export const OPERATIONAL_TENANT_ROLES: readonly UserRole[] = [
  "front_office",
  "back_office",
]

// Roles that can see the Access Expiry column. Per US-04 access expiry is
// meaningful only for auditor users; system_admin also sees it to manage
// auditor engagement windows.
export const ACCESS_EXPIRY_VISIBLE_ROLES: readonly UserRole[] = [
  "system_admin",
  "auditor",
]

export type UserFilterState = {
  role: UserRole[]
  status: string[]
  tenant_id: string | null
  // UI ready — backend GET /api/v1/users does not support mfa_enabled filter yet
  mfa_enabled: string | null
  // UI ready — backend GET /api/v1/users does not support lg_id filter yet
  lg_id: string | null
}

export const EMPTY_FILTER_STATE: UserFilterState = {
  role: [],
  status: [],
  tenant_id: null,
  mfa_enabled: null,
  lg_id: null,
}

export type UserActionType =
  | "approve"
  | "suspend"
  | "reactivate"
  | "deactivate"
  | "resend-invitation"
export type UserModalActionType = Exclude<UserActionType, "approve">
