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

export type UserFilterState = {
  role: UserRole[]
  status: string[]
  tenant_id: string | null
}

export const EMPTY_FILTER_STATE: UserFilterState = {
  role: [],
  status: [],
  tenant_id: null,
}

export type UserActionType =
  | "approve"
  | "suspend"
  | "reactivate"
  | "deactivate"
  | "resend-invitation"
export type UserModalActionType = Exclude<UserActionType, "approve">
