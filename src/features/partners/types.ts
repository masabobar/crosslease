import type { UserRole } from "@/features/users/types"

// Shared shape for the color/label config badges use to render a status pill —
// PartnerStatusBadge and DuplicatePairStatusBadge each key their own enum
// against this same structure.
export type StatusConfig = {
  container: string
  dot: string
  text: string
}

// Per US 13.1 / US 13.7 permission matrix: Sys Admin is ✓ for both view and create/submit.
export const PARTNER_VIEW_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "auditor",
  "bank_power_user",
  "front_office",
  "back_office",
]

// Per US 13.1 / US 13.7 permission matrix: Sys Admin and FO are ✓ for create/submit.
export const PARTNER_SUBMIT_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "bank_power_user",
  "front_office",
]

// Per PARTNER_DUPLICATE_RESOLVE permission (refinext-api permissions/matrix.py):
// Sys Admin and Back Office only.
export const PARTNER_DUPLICATE_RESOLVE_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "back_office",
]

// Per PARTNER_MERGE_INITIATE permission (refinext-api permissions/matrix.py):
// Sys Admin and Front Office only.
export const PARTNER_MERGE_INITIATE_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "front_office",
]

export type PartnerActionType = "archive"
