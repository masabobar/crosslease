import type { UserRole } from "@/features/users/types"

export const PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "bank_power_user",
]

export const PRODUCT_TEMPLATE_READ_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "bank_power_user",
  "front_office",
  "back_office",
  "support_user",
  "auditor",
]

export type ProductTemplateWizardStep =
  | "identity"
  | "behavioral"
  | "eligibility"
  | "orchestration"
  | "review"

export type DraftRef = { templateId: string; versionNumber: string }
