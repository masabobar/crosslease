import { z } from "zod"
import { format } from "date-fns"
import {
  TERMINATION_JUSTIFICATION_MAX_LENGTH,
  TERMINATION_JUSTIFICATION_MIN_LENGTH,
} from "@/features/productTemplates/constants"
import { requiredEnum } from "@/lib/zodHelpers"
import { FieldDiffItemSchema } from "@/types/api"

// Wire enums — must match refinext-api src/app/modules/product_templates/domain/enums.py exactly
export const FinancingTypeSchema = z.enum([
  "full_refinancing",
  "partial_refinancing",
  "residual_value_financing",
  "true_sale_forfaiting",
  "refinancing_credit_line",
  "structured_portfolio",
])
export type FinancingType = z.infer<typeof FinancingTypeSchema>

export const LegalStructureSchema = z.enum(["loan_credit", "true_sale"])
export type LegalStructure = z.infer<typeof LegalStructureSchema>

export const PaymentTimingSchema = z.enum(["advance", "arrears"])
export type PaymentTiming = z.infer<typeof PaymentTimingSchema>

export const RateBasisSchema = z.enum([
  "30_360",
  "act_360",
  "act_365",
  "act_act",
])
export type RateBasis = z.infer<typeof RateBasisSchema>

export const CalculationModelSchema = z.enum(["annuity", "bullet", "irregular"])
export type CalculationModel = z.infer<typeof CalculationModelSchema>

export const RateTypeSchema = z.enum(["fixed", "floating", "euribor_spread"])
export type RateType = z.infer<typeof RateTypeSchema>

export const FirstInstallmentRuleSchema = z.enum([
  "submission_month",
  "following_month",
  "configurable_offset",
])
export type FirstInstallmentRule = z.infer<typeof FirstInstallmentRuleSchema>

export const DisbursementDerivationRuleSchema = z.enum([
  "npv",
  "npv_ltv",
  "rv_only",
])
export type DisbursementDerivationRule = z.infer<
  typeof DisbursementDerivationRuleSchema
>

export const AssetCategorySchema = z.enum([
  "machinery",
  "vehicles",
  "it_equipment",
  "real_estate",
  "energy_assets",
  "other",
])
export type AssetCategory = z.infer<typeof AssetCategorySchema>

// TemplateStatus mirrors domain/enums.py TemplateStatus exactly (7 values). The bpt1803v2
// migration (2026-08-05) replaced the old draft/awaiting_*_countersignature/published/
// deprecated/discarded model with this one — the Four-Eyes awaiting states were folded back
// into draft. Declared here, above the first response schema that references it, rather than
// down with the version-history shapes: every `version_status` field below is this enum, and
// a `const` referenced before its initializer throws at module load.
export const TemplateStatusSchema = z.enum([
  "draft",
  "scheduled",
  "active",
  "superseded",
  "expired",
  "terminated",
  "discarded",
])
export type TemplateStatus = z.infer<typeof TemplateStatusSchema>

// Wire request/response schemas — match CreateTemplateDraftRequest / UpdateTemplateDraftRequest
// in refinext-api interfaces/http/schemas/product_template.py. Only financing_type, legal_structure,
// payment_timing, rate_basis, calculation_model are hard-required at create time (see plan Gap 2) —
// every other field is optional at the wire level even though the PRD marks most of them Mandatory
// (full validation is deferred to publish, per the PRD's own Validation Rules section).
export const CreateProductTemplateDraftRequestSchema = z.object({
  template_name: z.string().min(1).max(200),
  financing_type: FinancingTypeSchema,
  legal_structure: LegalStructureSchema,
  payment_timing: PaymentTimingSchema,
  rate_basis: RateBasisSchema,
  calculation_model: CalculationModelSchema,
  template_description: z.string().max(1000).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  // rate_type and npv_formula_ref are deliberately absent: the BE dropped both from the
  // create/edit requests under CR PRD1042-1546 B9/B10 (pricing belongs to the deal, and the
  // NPV formula resolves server-side to one method). Both stay on the detail response.
  first_installment_rule: FirstInstallmentRuleSchema.optional(),
  disbursement_derivation_rule: DisbursementDerivationRuleSchema.optional(),
  allowed_asset_categories: z.array(AssetCategorySchema).optional(),
  min_term_months: z.number().int().optional(),
  max_term_months: z.number().int().optional(),
  max_ltv_ratio: z.number().optional(),
  min_volume_eur: z.number().optional(),
  max_volume_eur: z.number().optional(),
})
export type CreateProductTemplateDraftRequest = z.infer<
  typeof CreateProductTemplateDraftRequestSchema
>

export const UpdateProductTemplateDraftRequestSchema =
  CreateProductTemplateDraftRequestSchema.partial()
export type UpdateProductTemplateDraftRequest = z.infer<
  typeof UpdateProductTemplateDraftRequestSchema
>

export const TemplateDraftCreatedResponseSchema = z.object({
  id: z.string().uuid(),
  template_code: z.string(),
  version_id: z.string().uuid(),
  version_number: z.string(),
  version_status: TemplateStatusSchema,
})
export type TemplateDraftCreatedResponse = z.infer<
  typeof TemplateDraftCreatedResponseSchema
>

export const TemplateDraftUpdatedResponseSchema = z.object({
  version_id: z.string().uuid(),
  version_status: TemplateStatusSchema,
})
export type TemplateDraftUpdatedResponse = z.infer<
  typeof TemplateDraftUpdatedResponseSchema
>

export const TemplateDraftDiscardedResponseSchema = z.object({
  version_id: z.string().uuid(),
  version_status: TemplateStatusSchema,
})
export type TemplateDraftDiscardedResponse = z.infer<
  typeof TemplateDraftDiscardedResponseSchema
>

export const PublishTemplateDraftRequestSchema = z.object({
  justification: z.string().nullable().optional(),
})
export type PublishTemplateDraftRequest = z.infer<
  typeof PublishTemplateDraftRequestSchema
>

export const PublishTemplateDraftResponseSchema = z.object({
  version_id: z.string().uuid(),
  version_number: z.string(),
  version_status: TemplateStatusSchema,
  activated_at: z.string(),
  activated_by: z.string().uuid(),
})
export type PublishTemplateDraftResponse = z.infer<
  typeof PublishTemplateDraftResponseSchema
>

// Wire response for POST /product-templates/{id}/versions (create_new_version) in
// refinext-api. Matches NewVersionCreatedResponse. The endpoint takes no request body:
// versioning is sequential integers (CR-1474), so there is no major/minor increment_type
// to choose — the BE derives the next version_number itself.
export const NewVersionCreatedResponseSchema = z.object({
  version_id: z.string().uuid(),
  version_number: z.string(),
  version_status: TemplateStatusSchema,
  predecessor_version_id: z.string().uuid().nullable(),
  snapshot_source_version_id: z.string().uuid().nullable(),
})
export type NewVersionCreatedResponse = z.infer<
  typeof NewVersionCreatedResponseSchema
>

// Wire request/response for POST .../terminate (terminate_template_version) in refinext-api.
// Renamed from deprecate/deprecated_at/by by the bpt1803v2 migration (2026-08-05); the
// response no longer carries an impact summary (ImpactSummarySchema was removed with it).
export const TerminateTemplateVersionRequestSchema = z.object({
  justification: z
    .string()
    .min(TERMINATION_JUSTIFICATION_MIN_LENGTH)
    .max(TERMINATION_JUSTIFICATION_MAX_LENGTH),
})
export type TerminateTemplateVersionRequest = z.infer<
  typeof TerminateTemplateVersionRequestSchema
>

export const TerminateTemplateVersionResponseSchema = z.object({
  version_id: z.string().uuid(),
  version_status: TemplateStatusSchema,
  terminated_at: z.string(),
  terminated_by: z.string().uuid(),
})
export type TerminateTemplateVersionResponse = z.infer<
  typeof TerminateTemplateVersionResponseSchema
>

// RHF-facing form schema — stricter than the wire schema, mirroring the PRD's Field Specification
// table (every Mandatory field required) for inline per-field validation. The actual POST/PATCH
// payload sent to the API is the looser wire schema above.
export const ProductTemplateWizardFormSchema = z
  .object({
    template_name: z.string().min(1, "required").max(200),
    template_description: z.string().max(1000).optional(),
    financing_type: requiredEnum(FinancingTypeSchema.options),
    legal_structure: requiredEnum(LegalStructureSchema.options),
    payment_timing: requiredEnum(PaymentTimingSchema.options),
    rate_basis: requiredEnum(RateBasisSchema.options),
    calculation_model: requiredEnum(CalculationModelSchema.options),
    first_installment_rule: requiredEnum(FirstInstallmentRuleSchema.options),
    disbursement_derivation_rule: requiredEnum(
      DisbursementDerivationRuleSchema.options
    ),
    allowed_asset_categories: z.array(AssetCategorySchema).min(1, "atLeastOne"),
    min_term_months: z
      .number()
      .int()
      .min(1, "termBelowMin")
      .max(600, "termAboveMax")
      .optional(),
    max_term_months: z
      .number()
      .int()
      .min(1, "termBelowMin")
      .max(600, "termAboveMax")
      .optional(),
    max_ltv_ratio: z
      .number()
      .min(0, "ltvBelowMin")
      .max(100, "ltvAboveMax")
      .optional(),
    min_volume_eur: z.number().min(0, "volumeBelowMin").optional(),
    max_volume_eur: z.number().min(0, "volumeBelowMin").optional(),
    valid_from: z.string({ error: "required" }).min(1, "required"),
    valid_until: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.min_term_months !== undefined &&
      data.max_term_months !== undefined &&
      data.min_term_months > data.max_term_months
    ) {
      ctx.addIssue({
        code: "custom",
        message: "minTermExceedsMax",
        path: ["min_term_months"],
      })
    }
    if (
      data.min_volume_eur !== undefined &&
      data.max_volume_eur !== undefined &&
      data.min_volume_eur > data.max_volume_eur
    ) {
      ctx.addIssue({
        code: "custom",
        message: "minVolumeExceedsMax",
        path: ["min_volume_eur"],
      })
    }
    // Both dates are wire-formatted yyyy-MM-dd, so lexicographic comparison is
    // chronological. valid_from is guarded against "" so a blank field reports only
    // its own "required" issue rather than also claiming to be in the past.
    if (
      data.valid_from !== "" &&
      data.valid_from < format(new Date(), "yyyy-MM-dd")
    ) {
      ctx.addIssue({
        code: "custom",
        message: "validFromInPast",
        path: ["valid_from"],
      })
    }
    if (
      data.valid_until !== undefined &&
      data.valid_until !== "" &&
      data.valid_until <= data.valid_from
    ) {
      ctx.addIssue({
        code: "custom",
        message: "validUntilNotAfterFrom",
        path: ["valid_until"],
      })
    }
  })
export type ProductTemplateWizardForm = z.infer<
  typeof ProductTemplateWizardFormSchema
>

// Version history — matches VersionHistoryResponse / TemplateVersionSummary in
// refinext-api interfaces/http/schemas/product_template.py. TemplateStatusSchema itself is
// declared above, next to the other wire enums.
export const UserRefSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string(),
})
export type UserRef = z.infer<typeof UserRefSchema>

export const TemplateVersionSummarySchema = z.object({
  id: z.string().uuid(),
  version_number: z.string(),
  version_status: TemplateStatusSchema,
  activated_at: z.string().nullable().optional(),
  terminated_at: z.string().nullable().optional(),
  activated_by: UserRefSchema.nullable().optional(),
  terminated_by: UserRefSchema.nullable().optional(),
  predecessor_version_id: z.string().uuid().nullable().optional(),
  superseding_version_id: z.string().uuid().nullable().optional(),
  bindings_count: z.number().int(),
  created_at: z.string(),
})
export type TemplateVersionSummary = z.infer<
  typeof TemplateVersionSummarySchema
>

export const VersionHistoryResponseSchema = z.object({
  versions: z.array(TemplateVersionSummarySchema),
})
export type VersionHistoryResponse = z.infer<
  typeof VersionHistoryResponseSchema
>

// VersionDetailResponse in refinext-api — used both for the Version History page
// header (template_name/version_status) and to prefill the wizard when authoring a
// new version from a Published template (US-10.5-FE). Deliberately omits template_code:
// it isn't present on this response, and there's no reachable single-template lookup
// from a bare templateId to source it from otherwise (see plan Gap 4).
export const TemplateVersionDetailSchema = z.object({
  version_number: z.string(),
  version_status: TemplateStatusSchema,
  template_name: z.string(),
  template_description: z.string().nullable().optional(),
  financing_type: FinancingTypeSchema,
  legal_structure: LegalStructureSchema,
  payment_timing: PaymentTimingSchema,
  rate_basis: RateBasisSchema,
  calculation_model: CalculationModelSchema,
  rate_type: RateTypeSchema.nullable().optional(),
  npv_formula_ref: z.string().nullable().optional(),
  first_installment_rule: FirstInstallmentRuleSchema.nullable().optional(),
  disbursement_derivation_rule:
    DisbursementDerivationRuleSchema.nullable().optional(),
  allowed_asset_categories: z.array(AssetCategorySchema).nullable().optional(),
  min_term_months: z.number().int().nullable().optional(),
  max_term_months: z.number().int().nullable().optional(),
  max_ltv_ratio: z.coerce.number().nullable().optional(),
  min_volume_eur: z.coerce.number().nullable().optional(),
  max_volume_eur: z.coerce.number().nullable().optional(),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  // On the wire but previously stripped — surfaced for the detail drawer's Metadata
  // section (US-10.8). Optional so the header/wizard-prefill consumers of this schema
  // never break if it's absent. created_by / updated_by / updated_at / tenant name are
  // NOT provided by the backend (see open-questions Q-028).
  created_at: z.string().nullable().optional(),
})
export type TemplateVersionDetail = z.infer<typeof TemplateVersionDetailSchema>

// Wire shape for GET /product-templates/{id}/diff (US 10.8 "Compare versions"). The item
// shape is shared with audit's and frameworkAgreements' diff responses, so it is defined once
// in @/types/api and re-exported here for the call sites that already import it from this file.
export { FieldDiffItemSchema }
export type { FieldDiffItem } from "@/types/api"

// Every compared field is returned, changed or not — the compare modal renders
// unchanged rows too and derives its highlight from old_value !== new_value client-side.
export const VersionDiffResponseSchema = z.object({
  template_id: z.string().uuid(),
  from_version: z.string(),
  to_version: z.string(),
  behavioral_settings: z.array(FieldDiffItemSchema),
  eligibility: z.array(FieldDiffItemSchema),
  orchestration_linkage: z.array(FieldDiffItemSchema),
})
export type VersionDiffResponse = z.infer<typeof VersionDiffResponseSchema>

// Wire response for GET /tenants/{tenant_id}/product-templates (list_templates) in
// refinext-api.
export const TemplateCurrentVersionSummarySchema = z.object({
  version_id: z.string().uuid(),
  version_number: z.string(),
  version_status: TemplateStatusSchema,
  financing_type: FinancingTypeSchema,
  legal_structure: LegalStructureSchema,
  calculation_model: CalculationModelSchema,
  payment_timing: PaymentTimingSchema,
  max_ltv_ratio: z.coerce.number().nullable().optional(),
  min_term_months: z.number().int().nullable().optional(),
  max_term_months: z.number().int().nullable().optional(),
  activated_by: UserRefSchema.nullable().optional(),
  activated_at: z.string().nullable().optional(),
})
export type TemplateCurrentVersionSummary = z.infer<
  typeof TemplateCurrentVersionSummarySchema
>

export const TemplateListItemSchema = z.object({
  id: z.string().uuid(),
  template_code: z.string(),
  // Serialized since PRD1042-1649. Still nullable: it is read off the latest version row,
  // so a template with no version yet has no name — the list falls back to template_code.
  template_name: z.string().nullable(),
  current_version: TemplateCurrentVersionSummarySchema.nullable(),
  created_at: z.string(),
})
export type TemplateListItem = z.infer<typeof TemplateListItemSchema>

export const TemplateListResponseSchema = z.object({
  items: z.array(TemplateListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  per_page: z.number().int(),
  total_pages: z.number().int(),
})
export type TemplateListResponse = z.infer<typeof TemplateListResponseSchema>
