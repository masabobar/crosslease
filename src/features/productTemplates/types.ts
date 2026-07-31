import type { UserRole } from "@/features/users/types"
import type { ProductTemplateWizardForm } from "@/features/productTemplates/api/schema"

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
