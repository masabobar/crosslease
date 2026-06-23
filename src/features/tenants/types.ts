import type { UserRole } from "@/features/users/types"

export const TENANT_LIST_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "support_user",
]

export const TENANT_DETAIL_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "support_user",
]

export const TENANT_CREATE_ALLOWED_ROLES: readonly UserRole[] = ["system_admin"]
