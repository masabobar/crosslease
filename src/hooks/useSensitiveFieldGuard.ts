import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { LC_ONLY_ROLES, READ_ONLY_VIEWER_ROLES } from "@/features/users/types"

/**
 * Returns true if the current user must NOT see sensitive internal fields
 * (KYC/AML details, risk scores, margins, pricing, approval conditions).
 *
 * Leasing company users (leasing_company_user) and support users (support_user)
 * receive true. All other internal bank roles and unauthenticated state receive false.
 */
export function useSensitiveFieldGuard(): boolean {
  const { data: currentUser } = useCurrentUser()

  if (!currentUser) return false

  return (
    LC_ONLY_ROLES.includes(currentUser.role) ||
    READ_ONLY_VIEWER_ROLES.includes(currentUser.role)
  )
}
