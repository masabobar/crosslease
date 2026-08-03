import type { UserResponse, UserStatus } from "@/features/users/api/schema"

export const USER_ROLES = [
  "system_admin",
  "support_user",
  "auditor",
  "bank_power_user",
  "front_office",
  "back_office",
  "leasing_company_user",
] as const

export type UserRole = (typeof USER_ROLES)[number]

export const SYSTEM_ADMIN_ROLE = "system_admin" as const
export const SUPPORT_USER_ROLE = "support_user" as const
export const BANK_POWER_USER_ROLE = "bank_power_user" as const
export const AUDITOR_ROLE = "auditor" as const
export const FRONT_OFFICE_ROLE = "front_office" as const
export const BACK_OFFICE_ROLE = "back_office" as const
export const LEASING_COMPANY_USER_ROLE = "leasing_company_user" as const

export const FOUR_EYES_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  SUPPORT_USER_ROLE,
  AUDITOR_ROLE,
]

export const TENANT_SCOPED_ROLES: readonly UserRole[] = [
  AUDITOR_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
  LEASING_COMPANY_USER_ROLE,
]

export const AUDITOR_DATE_RANGE_ROLES: readonly UserRole[] = [AUDITOR_ROLE]

export const READ_ONLY_VIEWER_ROLES: readonly UserRole[] = [
  SUPPORT_USER_ROLE,
  AUDITOR_ROLE,
]

export const USER_MANAGEMENT_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  SUPPORT_USER_ROLE,
  AUDITOR_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
]

export const LC_ONLY_ROLES: readonly UserRole[] = [LEASING_COMPANY_USER_ROLE]

// The four constants below mirror the backend permission matrix for user administration
// (`shared/permissions/matrix.py`). Per US-28.8, the Power User (Bank Admin) administers
// onboarding for its own tenant; the backend scopes every one of these actions to the
// caller's tenant and returns 404 for a target outside it.
export const USER_INVITE_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  BANK_POWER_USER_ROLE,
]

// Resend invitation, suspend, reactivate, deactivate, reset MFA.
export const USER_LIFECYCLE_ACTION_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  BANK_POWER_USER_ROLE,
]

export const USER_IDENTITY_EDIT_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  BANK_POWER_USER_ROLE,
]

export const USER_EXPORT_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  AUDITOR_ROLE,
  BANK_POWER_USER_ROLE,
]

// Approving a pending invitation is Four-Eyes on platform roles only, so it stays
// system_admin-only — a Bank Admin never sees a platform user in its tenant-scoped list.
export const USER_APPROVE_ROLES: readonly UserRole[] = [SYSTEM_ADMIN_ROLE]

// Role change and auditor access-period update: the Bank Admin holds neither
// `user:change_role` nor `user:update_access_period`.
export const USER_ROLE_CHANGE_ROLES: readonly UserRole[] = [SYSTEM_ADMIN_ROLE]

// Roles a Bank Admin may invite. Platform roles and bank_power_user itself are
// system_admin-only — the backend rejects them with 403 INVITE_ROLE_NOT_PERMITTED.
export const BANK_ADMIN_INVITABLE_ROLES: readonly UserRole[] = [
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
  LEASING_COMPANY_USER_ROLE,
]

// Roles that can use cross-tenant filters (Tenant + LG dropdowns).
// Auditor is excluded: the backend scopes their results to their assigned tenant.
export const TENANT_FILTER_VISIBLE_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  SUPPORT_USER_ROLE,
]

// Roles that see governance-related filters (Audit Engagement Status, System User Flag,
// Service Account Flag, Origin Type, Last Role/Permission Change Date).
// Per US-05 v2 filter visibility matrix.
export const GOVERNANCE_FILTER_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  AUDITOR_ROLE,
]

export const INTERNAL_BANK_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  SUPPORT_USER_ROLE,
  AUDITOR_ROLE,
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
  BANK_POWER_USER_ROLE,
]

export const WRITE_ACTION_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
]

// Roles that must not see sensitive authentication details in the user list
// (MFA status, last login). Per US-04: support users receive only
// "permitted support-level fields" and cannot see auth details.
export const SENSITIVE_AUTH_RESTRICTED_ROLES: readonly UserRole[] = [
  SUPPORT_USER_ROLE,
]

// Operational bank-tenant roles — scoped to their own tenant.
// In the user list the Tenant column is redundant for these viewers
// because the backend already filters to their tenant.
export const OPERATIONAL_TENANT_ROLES: readonly UserRole[] = [
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
]

// Roles that can see the Access Expiry column. Per US-04 access expiry is
// meaningful only for auditor users; system_admin also sees it to manage
// auditor engagement windows.
export const ACCESS_EXPIRY_VISIBLE_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  AUDITOR_ROLE,
]

// Only filters the backend actually honours. An unsupported filter is deliberately
// absent rather than rendered inert: a control the user can set that changes nothing
// reads as a broken list (see .claude/rules/api-first.md §4).
export type UserFilterState = {
  role: UserRole[]
  status: UserStatus[]
  tenant_id: string | null
  last_login_from: string | null
  last_login_to: string | null
}

export const EMPTY_FILTER_STATE: UserFilterState = {
  role: [],
  status: [],
  tenant_id: null,
  last_login_from: null,
  last_login_to: null,
}

export const USER_ACTION_TYPE = {
  APPROVE: "approve",
  SUSPEND: "suspend",
  REACTIVATE: "reactivate",
  DEACTIVATE: "deactivate",
  RESEND_INVITATION: "resend-invitation",
  RESET_MFA: "reset-mfa",
} as const

export type UserActionType =
  (typeof USER_ACTION_TYPE)[keyof typeof USER_ACTION_TYPE]

export type UserModalActionType = Exclude<
  UserActionType,
  typeof USER_ACTION_TYPE.APPROVE | typeof USER_ACTION_TYPE.RESET_MFA
>

export const USER_DETAIL_TAB = {
  LIFECYCLE: "lifecycle",
  AUTH: "auth",
  AUDIT: "audit",
} as const

export type UserDetailTabKey =
  (typeof USER_DETAIL_TAB)[keyof typeof USER_DETAIL_TAB]

// Allowed role transitions when an Admin changes an existing user's role.
// Only peer-level switches are permitted: Admin↔Support and FO↔BO.
// Auditor and Leasing Company User roles are locked (not present as keys).
export const ROLE_TRANSITIONS: Partial<Record<UserRole, readonly UserRole[]>> =
  {
    [SYSTEM_ADMIN_ROLE]: [SUPPORT_USER_ROLE],
    [SUPPORT_USER_ROLE]: [SYSTEM_ADMIN_ROLE],
    [FRONT_OFFICE_ROLE]: [BACK_OFFICE_ROLE],
    [BACK_OFFICE_ROLE]: [FRONT_OFFICE_ROLE],
  }

export const PLATFORM_USER_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  SUPPORT_USER_ROLE,
  AUDITOR_ROLE,
]

export const INVITE_RESULT_TYPE = {
  INVITED: "invited",
  PENDING_APPROVAL: "pending_approval",
} as const

export type InviteSuccessResult =
  | { type: typeof INVITE_RESULT_TYPE.INVITED; user: UserResponse }
  | {
      type: typeof INVITE_RESULT_TYPE.PENDING_APPROVAL
      firstName: string
      lastName: string
      email: string
      subjectId: string | null
    }
