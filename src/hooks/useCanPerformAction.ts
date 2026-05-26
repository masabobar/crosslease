import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { WRITE_ACTION_ROLES } from "@/features/users/types"

/**
 * Returns true if the current user's role permits write actions
 * (create, edit, delete, approve).
 *
 * Read-only roles (support_user, auditor) and LC users
 * (leasing_company_user) receive false.
 */
export function useCanPerformAction(): boolean {
  const { data: currentUser } = useCurrentUser()

  if (!currentUser) return false

  return WRITE_ACTION_ROLES.includes(currentUser.role)
}
