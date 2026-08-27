import type { UserRole } from "@/features/users/types"

// Per US 16.19/16.1/16.20 Permission Matrices: Power User (bank_power_user) is the sole
// authoring role — System Admin has no authority over this bank-level catalog.
export const DOCUMENT_REQUIREMENT_CATALOG_MANAGE_ALLOWED_ROLES: readonly UserRole[] =
  ["bank_power_user"]

// support_user/auditor get read-only diagnostic access; front_office, back_office,
// system_admin, and leasing_company_user have no access at all (bank-internal).
export const DOCUMENT_REQUIREMENT_CATALOG_READ_ALLOWED_ROLES: readonly UserRole[] =
  ["bank_power_user", "support_user", "auditor"]

// PRD1042-1794 Block 10 — the document-type registry management screen. Purely an authoring
// surface (list/create/edit/deactivate all require DOCUMENT_REQUIREMENT_CATALOG_* write perms
// held only by the Power User), so unlike the catalogue READ set above it is bank_power_user only
// — no read-only diagnostic access for support_user/auditor.
export const DOCUMENT_TYPE_MANAGE_ALLOWED_ROLES: readonly UserRole[] = [
  "bank_power_user",
]

// Mirrors the roles granted DOCUMENT_REQUIREMENT_CATALOG_RUNTIME_READ in the backend's permission
// matrix — a case surface, not an authoring one, so it is wider than the catalogue read set above.
// leasing_company_user is absent by design: an LC sees only its own obligations (item 9), never the
// catalogue, the layers or what blocks. system_admin is absent because it has nothing in this epic.
export const CASE_DOCUMENT_REQUIREMENTS_READ_ALLOWED_ROLES: readonly UserRole[] =
  ["bank_power_user", "back_office", "front_office", "support_user", "auditor"]

// UI-only enum, never crosses the wire — a plain type guard is enough (no Zod schema needed
// per .claude/rules/enums-and-constants.md §3).
export type DocumentRequirementCatalogDetailTab =
  | "identity"
  | "requirements"
  | "audit"
