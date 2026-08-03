import {
  ACCESS_EXPIRY_VISIBLE_ROLES,
  FOUR_EYES_ROLES,
  GOVERNANCE_FILTER_ROLES,
  OPERATIONAL_TENANT_ROLES,
  PLATFORM_USER_ROLES,
  SENSITIVE_AUTH_RESTRICTED_ROLES,
  TENANT_FILTER_VISIBLE_ROLES,
  USER_APPROVE_ROLES,
  USER_LIFECYCLE_ACTION_ROLES,
  USER_MANAGEMENT_ALLOWED_ROLES,
} from "@/features/users/types"
import type { UserRole, UserModalActionType } from "@/features/users/types"
import { UserStatusSchema } from "@/features/users/api/schema"
import type { UserStatus } from "@/features/users/api/schema"

export function getRoleClassificationKey(
  role: UserRole
):
  | "detail.page.roleClassification.platform"
  | "detail.page.roleClassification.tenantOperational" {
  if (PLATFORM_USER_ROLES.includes(role))
    return "detail.page.roleClassification.platform"
  return "detail.page.roleClassification.tenantOperational"
}

export type UserListColumnVisibility = {
  tenant: boolean
  mfa: boolean
  lastLogin: boolean
  accessExpiry: boolean
}

/**
 * Derives which optional columns are visible in the user list table based on
 * the viewing user's role, per US-04 visibility rules.
 *
 * - support_user: cannot see sensitive auth details (MFA, last login)
 * - front_office / back_office: tenant-scoped, so tenant column is always the
 *   same value and is hidden to reduce noise
 */
export function getUserListColumnVisibility(
  viewerRole: UserRole | null | undefined
): UserListColumnVisibility {
  const isOperationalTenantRole =
    !!viewerRole && OPERATIONAL_TENANT_ROLES.includes(viewerRole)
  const isSensitiveAuthRestricted =
    !!viewerRole && SENSITIVE_AUTH_RESTRICTED_ROLES.includes(viewerRole)

  return {
    tenant: !isOperationalTenantRole,
    mfa: !isSensitiveAuthRestricted,
    lastLogin: !isSensitiveAuthRestricted,
    accessExpiry:
      !!viewerRole && ACCESS_EXPIRY_VISIBLE_ROLES.includes(viewerRole),
  }
}

export type UserFilterVisibility = {
  tenant: boolean
  lg: boolean
  mfa: boolean
  lastLogin: boolean
  accessExpiry: boolean
  // Governance filters — per US-05 v2 filter visibility matrix
  auditEngagementStatus: boolean
  systemUserFlag: boolean
  serviceAccountFlag: boolean
  originType: boolean
  lastRoleChangeDate: boolean
  lastPermissionChangeDate: boolean
}

/**
 * Derives which filter panel controls are visible for a given viewer role,
 * per US-05 v2 filter visibility matrix.
 *
 * - support_user: no MFA / last-login / access-expiry / governance filters
 *   (except originType which is visible to all three management roles)
 * - auditor: no tenant / LG (already scoped to assigned tenant by the backend)
 */
export function getUserFilterVisibility(
  viewerRole: UserRole | null | undefined
): UserFilterVisibility {
  const isSensitiveAuthRestricted =
    !!viewerRole && SENSITIVE_AUTH_RESTRICTED_ROLES.includes(viewerRole)
  const canFilterByTenant =
    !!viewerRole && TENANT_FILTER_VISIBLE_ROLES.includes(viewerRole)
  const isGovernanceRole =
    !!viewerRole && GOVERNANCE_FILTER_ROLES.includes(viewerRole)
  const isManagementRole =
    !!viewerRole && USER_MANAGEMENT_ALLOWED_ROLES.includes(viewerRole)

  return {
    tenant: canFilterByTenant,
    lg: canFilterByTenant,
    mfa: !isSensitiveAuthRestricted,
    lastLogin: !isSensitiveAuthRestricted,
    accessExpiry:
      !!viewerRole && ACCESS_EXPIRY_VISIBLE_ROLES.includes(viewerRole),
    auditEngagementStatus: isGovernanceRole,
    systemUserFlag: isGovernanceRole,
    serviceAccountFlag: isGovernanceRole,
    originType: isManagementRole,
    lastRoleChangeDate: isGovernanceRole,
    lastPermissionChangeDate: isGovernanceRole,
  }
}

export type UserActionVisibility = {
  canApprove: boolean
  canResendInvitation: boolean
  canSuspend: boolean
  canReactivate: boolean
  canDeactivate: boolean
  canResetMfa: boolean
  hasAnyAction: boolean
}

export function getUserActionVisibility(
  status: UserStatus,
  role: UserRole,
  viewerRole: UserRole | null | undefined
): UserActionVisibility {
  const canApprove =
    !!viewerRole &&
    USER_APPROVE_ROLES.includes(viewerRole) &&
    status === UserStatusSchema.enum.pending_approval &&
    FOUR_EYES_ROLES.includes(role)
  const canRunLifecycleAction =
    !!viewerRole && USER_LIFECYCLE_ACTION_ROLES.includes(viewerRole)
  const canResendInvitation =
    canRunLifecycleAction && status === UserStatusSchema.enum.invited
  const canSuspend =
    canRunLifecycleAction && status === UserStatusSchema.enum.active
  const canReactivate =
    canRunLifecycleAction && status === UserStatusSchema.enum.suspended
  const canDeactivate =
    canRunLifecycleAction &&
    (status === UserStatusSchema.enum.active ||
      status === UserStatusSchema.enum.suspended)
  const canResetMfa =
    canRunLifecycleAction &&
    (status === UserStatusSchema.enum.active ||
      status === UserStatusSchema.enum.suspended)
  return {
    canApprove,
    canResendInvitation,
    canSuspend,
    canReactivate,
    canDeactivate,
    canResetMfa,
    hasAnyAction:
      canApprove ||
      canResendInvitation ||
      canSuspend ||
      canReactivate ||
      canDeactivate ||
      canResetMfa,
  }
}

export type IdentityPatch = {
  first_name: string
  last_name: string
  phone_number?: string | null
}

/**
 * Builds the PATCH body for an identity edit, and reports whether anything changed.
 *
 * `phone_number` is included only when it actually changed, because the endpoint treats
 * a present-but-null value as "clear the number" — sending it unconditionally would wipe
 * a phone the user never touched. An empty input string means "clear it" and becomes null.
 */
export function buildIdentityPatch(
  values: { first_name: string; last_name: string; phone_number?: string },
  current: {
    first_name: string
    last_name: string
    phone_number?: string | null
  }
): { patch: IdentityPatch; hasChanges: boolean } {
  const hasNameChanges =
    values.first_name !== current.first_name ||
    values.last_name !== current.last_name
  const hasPhoneChange =
    (values.phone_number ?? "") !== (current.phone_number ?? "")

  const patch: IdentityPatch = {
    first_name: values.first_name,
    last_name: values.last_name,
  }
  if (hasPhoneChange) {
    patch.phone_number =
      values.phone_number === "" ? null : (values.phone_number ?? null)
  }

  return { patch, hasChanges: hasNameChanges || hasPhoneChange }
}

type ActionToastKey =
  | "actions.suspend.success.title"
  | "actions.suspend.success.message"
  | "actions.reactivate.success.title"
  | "actions.reactivate.success.message"
  | "actions.deactivate.success.title"
  | "actions.deactivate.success.message"
  | "actions.resend-invitation.success.title"
  | "actions.resend-invitation.success.message"

type ActionTranslator = (
  key: ActionToastKey,
  options?: Record<string, unknown>
) => string

export function buildActionToastPayload(
  action: UserModalActionType,
  name: string,
  t: ActionTranslator
): { variant: "success" | "warning"; title: string; message: string } {
  const map: Record<
    UserModalActionType,
    { variant: "success" | "warning"; title: string; message: string }
  > = {
    suspend: {
      variant: "warning",
      title: t("actions.suspend.success.title"),
      message: t("actions.suspend.success.message", { name }),
    },
    reactivate: {
      variant: "success",
      title: t("actions.reactivate.success.title"),
      message: t("actions.reactivate.success.message", { name }),
    },
    deactivate: {
      variant: "warning",
      title: t("actions.deactivate.success.title"),
      message: t("actions.deactivate.success.message", { name }),
    },
    "resend-invitation": {
      variant: "success",
      title: t("actions.resend-invitation.success.title"),
      message: t("actions.resend-invitation.success.message", { name }),
    },
  }
  return map[action]
}
