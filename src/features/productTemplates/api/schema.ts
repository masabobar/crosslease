import { z } from "zod"
import { DEPRECATION_JUSTIFICATION_MIN_LENGTH } from "@/features/productTemplates/constants"
import { requiredEnum } from "@/lib/zodHelpers"

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
  rate_type: RateTypeSchema.optional(),
  npv_formula_ref: z.string().optional(),
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
  version_status: z.string(),
})
export type TemplateDraftCreatedResponse = z.infer<
  typeof TemplateDraftCreatedResponseSchema
>

export const TemplateDraftUpdatedResponseSchema = z.object({
  version_id: z.string().uuid(),
  version_status: z.string(),
})
export type TemplateDraftUpdatedResponse = z.infer<
  typeof TemplateDraftUpdatedResponseSchema
>

export const TemplateDraftDiscardedResponseSchema = z.object({
  version_id: z.string().uuid(),
  version_status: z.string(),
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
  version_status: z.string(),
  published_at: z.string(),
  published_by: z.string().uuid(),
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
  version_status: z.string(),
  predecessor_version_id: z.string().uuid().nullable(),
  snapshot_source_version_id: z.string().uuid().nullable(),
})
export type NewVersionCreatedResponse = z.infer<
  typeof NewVersionCreatedResponseSchema
>

// Wire request/response for POST .../deprecate (deprecate_version) in refinext-api.
// impact_summary is intentionally omitted — the BE response schema declares it but
// deprecate_version never populates real counts (always defaults), so the FE doesn't
// parse a field it can't trust (see plan Gap 3).
export const DeprecateTemplateVersionRequestSchema = z.object({
  justification: z.string().min(DEPRECATION_JUSTIFICATION_MIN_LENGTH).max(2000),
})
export type DeprecateTemplateVersionRequest = z.infer<
  typeof DeprecateTemplateVersionRequestSchema
>

export const DeprecateTemplateVersionResponseSchema = z.object({
  version_id: z.string().uuid(),
  version_status: z.string(),
  deprecated_at: z.string(),
  deprecated_by: z.string().uuid(),
})
export type DeprecateTemplateVersionResponse = z.infer<
  typeof DeprecateTemplateVersionResponseSchema
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
    rate_type: requiredEnum(RateTypeSchema.options),
    npv_formula_ref: z.string({ error: "required" }).min(1, "required"),
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
    if (
      data.valid_until !== undefined &&
      data.valid_until !== "" &&
      data.valid_until < data.valid_from
    ) {
      ctx.addIssue({
        code: "custom",
        message: "validUntilBeforeFrom",
        path: ["valid_until"],
      })
    }
  })
export type ProductTemplateWizardForm = z.infer<
  typeof ProductTemplateWizardFormSchema
>

// Version history — matches VersionHistoryResponse / TemplateVersionSummary in
// refinext-api interfaces/http/schemas/product_template.py. TemplateStatus mirrors
// domain/enums.py TemplateStatus exactly (6 values, including the Four-Eyes awaiting states
// which the FE badge must still render even though the Four-Eyes flow itself isn't built yet).
export const TemplateStatusSchema = z.enum([
  "draft",
  "awaiting_activation_countersignature",
  "awaiting_deprecation_countersignature",
  "published",
  "deprecated",
  "discarded",
])
export type TemplateStatus = z.infer<typeof TemplateStatusSchema>

export const UserRefSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string(),
})
export type UserRef = z.infer<typeof UserRefSchema>

export const TemplateVersionSummarySchema = z.object({
  id: z.string().uuid(),
  version_number: z.string(),
  version_status: TemplateStatusSchema,
  published_at: z.string().nullable().optional(),
  deprecated_at: z.string().nullable().optional(),
  published_by: UserRefSchema.nullable().optional(),
  deprecated_by: UserRefSchema.nullable().optional(),
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
})
export type TemplateVersionDetail = z.infer<typeof TemplateVersionDetailSchema>

// Wire response for GET /tenants/{tenant_id}/product-templates (list_templates) in
// refinext-api. TemplateListItem deliberately has no template_name field on the BE —
// only template_code — even though the Figma design's "Product" column shows a
// human-readable name; the join already fetches it but the response schema doesn't map
// it through. Flagged BE gap: FE renders template_code as the primary label until the BE
// maps template_name through.
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
  published_by: UserRefSchema.nullable().optional(),
  published_at: z.string().nullable().optional(),
})
export type TemplateCurrentVersionSummary = z.infer<
  typeof TemplateCurrentVersionSummarySchema
>

export const TemplateListItemSchema = z.object({
  id: z.string().uuid(),
  template_code: z.string(),
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
