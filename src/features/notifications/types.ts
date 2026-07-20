import type { UserRole } from "@/features/users/types"

// Backend grants NOTIFICATION_CONFIG_READ only to system_admin (frozenset(Permission) in matrix.py)
export const NOTIFICATION_CONFIG_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
]
