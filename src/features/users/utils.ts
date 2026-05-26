import { FOUR_EYES_ROLES } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"

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
