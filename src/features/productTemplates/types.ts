import {
  AUDITOR_ROLE,
  BACK_OFFICE_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
  SUPPORT_USER_ROLE,
} from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import { TemplateStatusSchema } from "@/features/productTemplates/api/schema"
import type {
  ProductTemplateWizardForm,
  TemplateStatus,
} from "@/features/productTemplates/api/schema"

// Statuses a user may filter the template list by. `discarded` is deliberately excluded:
// per CR-BPT-05 on PRD1042-1798 it exists on the backend only, because a draft can be
// discarded, and "discarded items should not be visible on frontend at all". Offering it in
// the filter both names a status the user is not meant to know about and guarantees an
// empty result set. Derived from the schema enum rather than retyped, so a status the
// backend adds shows up here on its own — see .claude/rules/enums-and-constants.md §3.
//
// (The Framework Agreement side used to make the same exclusion in its version-history
// screen; that screen is gone with CR-FA-04's withdrawal on PRD1042-1799, so this is now
// the only place the rule is applied.)
//
// Lives here rather than in constants.ts because constants.ts is imported *by* api/schema.ts
// (for the termination-justification bounds), so reading the schema enum from there would
// close an initialization cycle.
export const FILTERABLE_TEMPLATE_STATUSES: readonly TemplateStatus[] =
  TemplateStatusSchema.options.filter(
    status => status !== TemplateStatusSchema.enum.discarded
  )

// system_admin is deliberately absent from both lists below: PRD1042-1703 #1 excludes the
// platform operator from every product_template:* permission (including the four-eyes
// approver role), matching the FA module's existing exclusion — see the same note in
// frameworkAgreements/types.ts.
export const PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES: readonly UserRole[] = [
  BANK_POWER_USER_ROLE,
]

export const PRODUCT_TEMPLATE_READ_ALLOWED_ROLES: readonly UserRole[] = [
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
    "refinancing_form",
    "legal_structure",
    "payment_timing",
    "rate_basis",
    "first_installment_rule",
    "disbursement_derivation_rule",
    "effective_rate",
  ],
  eligibility: [
    "allowed_asset_categories",
    "min_term_months",
    "max_term_months",
    "max_ltv_ratio",
    "min_volume_eur",
    "max_volume_eur",
    "valid_from",
  ],
  review: [],
}

export type DraftRef = { templateId: string; versionNumber: string }
