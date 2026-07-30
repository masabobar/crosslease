import type { UserRole } from "@/features/users/types"

// Per PRD1042-1158/1159/1180 permission matrices: Power User (bank_power_user) is the
// sole authoring role — unlike Product Templates/Framework Agreements, system_admin has
// no authority over this bank-level catalog.
export const WORKFLOW_TASK_CATALOG_MANAGE_ALLOWED_ROLES: readonly UserRole[] = [
  "bank_power_user",
]

// support_user/auditor get read-only diagnostic access; front_office, back_office,
// system_admin, and leasing_company_user have no access at all (bank-internal, WTC-12).
export const WORKFLOW_TASK_CATALOG_READ_ALLOWED_ROLES: readonly UserRole[] = [
  "bank_power_user",
  "support_user",
  "auditor",
]

export type WorkflowTaskCatalogDetailTab =
  | "identity"
  | "taskDefinitions"
  | "auditTrail"
