import { SYSTEM_ADMIN_ROLE } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"

// Backend grants NOTIFICATION_CONFIG_READ only to system_admin (frozenset(Permission) in matrix.py)
export const NOTIFICATION_CONFIG_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
]
