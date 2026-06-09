import {
  ACCESS_EXPIRY_VISIBLE_ROLES,
  FOUR_EYES_ROLES,
  GOVERNANCE_FILTER_ROLES,
  OPERATIONAL_TENANT_ROLES,
  SENSITIVE_AUTH_RESTRICTED_ROLES,
  SYSTEM_ADMIN_ROLE,
  TENANT_FILTER_VISIBLE_ROLES,
  USER_MANAGEMENT_ALLOWED_ROLES,
} from "@/features/users/types"
import type { UserRole, UserModalActionType } from "@/features/users/types"
import type { UserStatus } from "@/features/users/api/schema"

const DATE_LOCALE = "en-GB"

const MS_PER_MINUTE = 1000 * 60
const MS_PER_HOUR = MS_PER_MINUTE * 60
const MS_PER_DAY = MS_PER_HOUR * 24

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
  hasAnyAction: boolean
}

export function getUserActionVisibility(
  status: UserStatus,
  role: UserRole,
  viewerRole: UserRole | null | undefined
): UserActionVisibility {
  const isAdmin = viewerRole === SYSTEM_ADMIN_ROLE
  const canApprove =
    isAdmin && status === "pending_approval" && FOUR_EYES_ROLES.includes(role)
  const canResendInvitation = isAdmin && status === "invited"
  const canSuspend = isAdmin && status === "active"
  const canReactivate = isAdmin && status === "suspended"
  const canDeactivate =
    isAdmin && (status === "active" || status === "suspended")
  return {
    canApprove,
    canResendInvitation,
    canSuspend,
    canReactivate,
    canDeactivate,
    hasAnyAction:
      canApprove ||
      canResendInvitation ||
      canSuspend ||
      canReactivate ||
      canDeactivate,
  }
}

type Translator = (
  key:
    | "time.justNow"
    | "time.minutesAgo"
    | "time.hoursAgo"
    | "time.yesterday"
    | "time.daysAgo",
  options?: Record<string, unknown>
) => string

export function formatLastLogin(dateStr: string | null, t: Translator): string {
  if (!dateStr) return "—"

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / MS_PER_MINUTE)
  const diffHours = Math.floor(diffMs / MS_PER_HOUR)
  const diffDays = Math.floor(diffMs / MS_PER_DAY)

  if (diffMinutes < 1) return t("time.justNow")
  if (diffMinutes < 60) return t("time.minutesAgo", { count: diffMinutes })
  if (diffHours < 24) return t("time.hoursAgo", { count: diffHours })
  if (diffDays === 1) return t("time.yesterday")
  if (diffDays < 7) return t("time.daysAgo", { count: diffDays })

  return date.toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  return `${date.toLocaleDateString(DATE_LOCALE, { day: "numeric", month: "short", year: "numeric" })}, ${date.toLocaleTimeString(DATE_LOCALE, { hour: "2-digit", minute: "2-digit" })}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
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
