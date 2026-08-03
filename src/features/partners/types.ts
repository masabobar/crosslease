import {
  AUDITOR_ROLE,
  BACK_OFFICE_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
  SYSTEM_ADMIN_ROLE,
} from "@/features/users/types"
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
  SYSTEM_ADMIN_ROLE,
  AUDITOR_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
]

// Per US 13.1 / US 13.7 permission matrix: Sys Admin and FO are ✓ for create/submit.
export const PARTNER_SUBMIT_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
]

// Per PARTNER_DUPLICATE_RESOLVE permission (refinext-api permissions/matrix.py):
// Sys Admin and Back Office only.
export const PARTNER_DUPLICATE_RESOLVE_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  BACK_OFFICE_ROLE,
]

// Per PARTNER_MERGE_INITIATE permission (refinext-api permissions/matrix.py):
// Sys Admin and Front Office only.
export const PARTNER_MERGE_INITIATE_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  FRONT_OFFICE_ROLE,
]

export type PartnerActionType = "archive"
