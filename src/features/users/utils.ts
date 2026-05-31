import {
  ACCESS_EXPIRY_VISIBLE_ROLES,
  FOUR_EYES_ROLES,
  GOVERNANCE_FILTER_ROLES,
  OPERATIONAL_TENANT_ROLES,
  SENSITIVE_AUTH_RESTRICTED_ROLES,
  TENANT_FILTER_VISIBLE_ROLES,
  USER_MANAGEMENT_ALLOWED_ROLES,
} from "@/features/users/types"
import type { UserRole } from "@/features/users/types"

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
  status: string,
  role: string,
  viewerRole: UserRole | null | undefined
): UserActionVisibility {
  const isAdmin = viewerRole === "system_admin"
  const canApprove =
    isAdmin &&
    status === "pending_activation" &&
    FOUR_EYES_ROLES.includes(role as UserRole)
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

export function formatLastLogin(dateStr: string | null): string {
  if (!dateStr) return "—"

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
