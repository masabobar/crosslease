import type { UserRole } from "@/features/users/types"
import type { FADocumentType } from "@/features/frameworkAgreements/api/schema"

// system_admin is deliberately absent from every list below: the CrossLease
// System Admin (platform operator) holds no framework_agreement:* permission at
// all — the BE subtracts the whole prefix from its role set (CR PRD1042-1550 /
// B5), so it 403s on FA_LIST and FA_READ alike.
export const FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES: readonly UserRole[] = [
  "bank_power_user",
]

// support_user is deliberately absent: the BE grants it neither FA_LIST nor
// FA_READ, so every query on the list and detail screens 403s and the user only
// ever reaches a generic error state. The spec's grant-scoped support view is
// not implemented — permissions resolve from a static role matrix with no
// grant-based elevation. Restore this role once the BE actually serves it.
export const FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES: readonly UserRole[] = [
  "bank_power_user",
  "front_office",
  "back_office",
  "auditor",
]

// Narrower than FA_READ: front_office lacks FA_AUDIT_READ entirely (403), and
// support_user/leasing_company_user hold the permission but the BE always 404s
// them on these endpoints (existence non-disclosure) — never real data. Only
// these three roles ever see populated audit history.
export const FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES: readonly UserRole[] =
  ["bank_power_user", "back_office", "auditor"]

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

// The edit wizard mirrors the create steps minus "documents": the BE only permits
// attach/detach while the agreement is in Draft (FA_DOC_IMMUTABLE), so documents stay
// on the detail page's Templates & Documents tab.
export type FrameworkAgreementEditStep = Exclude<
  FrameworkAgreementWizardStep,
  "documents"
>

export const FRAMEWORK_AGREEMENT_EDIT_STEPS: readonly FrameworkAgreementEditStep[] =
  ["identity", "envelopePricing", "validityTemplates", "conditions", "review"]

export type FrameworkAgreementDocumentDraft = {
  file: File
  documentType: FADocumentType | ""
  documentLabel: string
}
