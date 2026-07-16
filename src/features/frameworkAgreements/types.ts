import type { UserRole } from "@/features/users/types"
import type { FADocumentType } from "@/features/frameworkAgreements/api/schema"

export const FRAMEWORK_AGREEMENT_CREATE_ALLOWED_ROLES: readonly UserRole[] = [
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

export type FrameworkAgreementWizardStep =
  | "identity"
  | "envelopePricing"
  | "validityTemplates"
  | "conditions"
  | "documents"
  | "review"

export type FrameworkAgreementDocumentDraft = {
  file: File
  documentType: FADocumentType | ""
  documentLabel: string
}
