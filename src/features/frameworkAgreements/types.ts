import type { UserRole } from "@/features/users/types"
import type { FADocumentType } from "@/features/frameworkAgreements/api/schema"

export const FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "bank_power_user",
]

export const FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "bank_power_user",
  "front_office",
  "back_office",
  "support_user",
  "auditor",
]

// Narrower than FA_READ: front_office lacks FA_AUDIT_READ entirely (403), and
// support_user/leasing_company_user hold the permission but the BE always 404s
// them on these endpoints (existence non-disclosure) — never real data. Only
// these four roles ever see populated audit history.
export const FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES: readonly UserRole[] =
  ["system_admin", "bank_power_user", "back_office", "auditor"]

export type FrameworkAgreementWizardStep =
  | "identity"
  | "envelopePricing"
  | "validityTemplates"
  | "conditions"
  | "documents"
  | "review"

export const FRAMEWORK_AGREEMENT_WIZARD_STEPS: readonly FrameworkAgreementWizardStep[] =
  [
    "identity",
    "envelopePricing",
    "validityTemplates",
    "conditions",
    "documents",
    "review",
  ]

export type FrameworkAgreementDocumentDraft = {
  file: File
  documentType: FADocumentType | ""
  documentLabel: string
}
