import type { UserRole } from "@/features/users/types"

// Per US 13.1 / US 13.7 permission matrix: Sys Admin is ✓ for both view and create/submit.
export const PARTNER_VIEW_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "auditor",
  "front_office",
  "back_office",
]

// Per US 13.1 / US 13.7 permission matrix: Sys Admin and FO are ✓ for create/submit.
export const PARTNER_SUBMIT_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "front_office",
]

export type PartnerActionType = "archive"
