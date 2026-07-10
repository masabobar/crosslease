import type { UserRole } from "@/features/users/types"

export const PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES: readonly UserRole[] = [
  "system_admin",
  "bank_power_user",
]

export type ProductTemplateWizardStep =
  | "identity"
  | "behavioral"
  | "eligibility"
