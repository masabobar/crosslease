import type { UserRole } from "@/features/users/types"

// Per US 16.19/16.1/16.20 Permission Matrices: Power User (bank_power_user) is the sole
// authoring role — System Admin has no authority over this bank-level catalog.
export const DOCUMENT_REQUIREMENT_CATALOG_MANAGE_ALLOWED_ROLES: readonly UserRole[] =
  ["bank_power_user"]

// support_user/auditor get read-only diagnostic access; front_office, back_office,
// system_admin, and leasing_company_user have no access at all (bank-internal).
export const DOCUMENT_REQUIREMENT_CATALOG_READ_ALLOWED_ROLES: readonly UserRole[] =
  ["bank_power_user", "support_user", "auditor"]
