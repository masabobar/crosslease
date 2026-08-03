import {
  AUDITOR_ROLE,
  BACK_OFFICE_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
  SUPPORT_USER_ROLE,
  SYSTEM_ADMIN_ROLE,
} from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import type { ProductTemplateWizardForm } from "@/features/productTemplates/api/schema"

export const PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  BANK_POWER_USER_ROLE,
]

export const PRODUCT_TEMPLATE_READ_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
  SUPPORT_USER_ROLE,
  AUDITOR_ROLE,
]

export type ProductTemplateWizardStep =
  | "identity"
  | "behavioral"
  | "eligibility"
  | "review"

/**
 * Fields validated when leaving each wizard step.
 *
 * `form.trigger(fields)` surfaces only the issues whose path is in the list it is
 * given, so a field omitted here is unvalidated no matter what the schema says —
 * including cross-field refinements that merely *report* on it. Every path
 * `ProductTemplateWizardFormSchema`'s refinements can report on must therefore appear
 * in the list of the step that owns it (asserted in the types test).
 */
export const WIZARD_STEP_FIELDS: Record<
  ProductTemplateWizardStep,
  (keyof ProductTemplateWizardForm)[]
> = {
  identity: ["template_name"],
  behavioral: [
    "financing_type",
    "legal_structure",
    "payment_timing",
    "rate_basis",
    "calculation_model",
    "first_installment_rule",
    "disbursement_derivation_rule",
  ],
  eligibility: [
    "allowed_asset_categories",
    "min_term_months",
    "max_term_months",
    "max_ltv_ratio",
    "min_volume_eur",
    "max_volume_eur",
    "valid_from",
    "valid_until",
  ],
  review: [],
}

export type DraftRef = { templateId: string; versionNumber: string }
