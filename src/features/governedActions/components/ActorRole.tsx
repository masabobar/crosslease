import { RoleBadge } from "@/features/users/components/RoleBadge"
import { USER_ROLES } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import { NO_VALUE } from "@/features/governedActions/utils"

// Actor snapshots store `role` as a free-form string, not a UserRole: the value is a
// historical record of the role the actor held at submission time, so a role that has
// since been renamed or removed must still render rather than fail parsing. The badge
// is therefore only used for values that are still current roles; anything else falls
// back to the raw value. This guard replaces the `as UserRole` cast that the review
// modal and the detail drawer each carried.
function isCurrentUserRole(role: string): role is UserRole {
  return (USER_ROLES as readonly string[]).includes(role)
}

export function ActorRole({ role }: { role: string | null | undefined }) {
  if (!role) return <span>{NO_VALUE}</span>
  if (isCurrentUserRole(role)) return <RoleBadge role={role} />
  return <span className="text-sm">{role}</span>
}
