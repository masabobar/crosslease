import { z } from "zod"
import { requiredEnum } from "@/lib/zodHelpers"

// Wire enums — must match refinext-api src/app/modules/framework_agreements/domain/enums.py exactly
export const FALifecycleStatusSchema = z.enum([
  "draft",
  "active",
  "suspended",
  "terminated",
])
export type FALifecycleStatus = z.infer<typeof FALifecycleStatusSchema>

export const BankEntitySchema = z.enum([
  "sparkasse",
  "landesbank_1",
  "landesbank_2",
  "other",
])
export type BankEntity = z.infer<typeof BankEntitySchema>

export const FADocumentTypeSchema = z.enum([
  "original_agreement",
  "addendum",
  "side_letter",
  "other",
])
export type FADocumentType = z.infer<typeof FADocumentTypeSchema>

// POST /framework-agreements — matches CreateFARequest in refinext-api fa_schemas.py exactly
export const CreateFARequestSchema = z.object({
  agreement_name: z.string().min(1).max(200),
  lc_partner_id: z.string().uuid(),
  bank_entity: BankEntitySchema,
  max_volume_eur: z.number().gt(0),
  // The single hand-entered interest rate (CR PRD1042-1552 A1/A2) — required on create
  // since the BE stopped deriving it from base_rate + spread.
  effective_rate: z.number(),
  // VFE (early-repayment penalty) flat rate — optional override; BE prefills from the
  // per-LC default on create (CR PRD1042-1495 B2). Matches CreateFARequest.vfe_rate.
  vfe_rate: z.number().min(0).max(100).optional(),
  valid_from: z.string().min(1),
  valid_until: z.string().optional(),
  special_conditions: z.string().optional(),
  product_template_ids: z.array(z.string().uuid()).min(1),
})
export type CreateFARequest = z.infer<typeof CreateFARequestSchema>

export const FADraftResponseSchema = z.object({
  id: z.string().uuid(),
  agreement_name: z.string(),
  lc_partner_id: z.string().uuid(),
  bank_entity: BankEntitySchema,
  currency: z.string(),
  status: FALifecycleStatusSchema,
  max_volume_eur: z.coerce.number(),
  effective_rate: z.coerce.number(),
  vfe_rate: z.coerce.number().nullable(),
  valid_from: z.string(),
  valid_until: z.string().nullable(),
  special_conditions: z.string().nullable(),
  product_template_ids: z.array(z.string().uuid()),
  edit_version_counter: z.number().int(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type FADraftResponse = z.infer<typeof FADraftResponseSchema>

// PATCH /framework-agreements/{id} — matches UpdateFARequest in refinext-api fa_schemas.py
// exactly. Every domain field is optional: the BE dispatches on current status to either
// update_draft() (agreement_name/valid_from freely editable) or edit_governed()
// (agreement_name/valid_from rejected as FA_IMMUTABLE_FIELDS if present — the FE never
// sends them in that case, see EditFrameworkAgreementDialog). justification/
// expected_version are governed-edit-only on the BE but harmless to always send.
export const UpdateFARequestSchema = z.object({
  agreement_name: z.string().min(1).max(200).optional(),
  max_volume_eur: z.number().gt(0).optional(),
  effective_rate: z.number().optional(),
  vfe_rate: z.number().min(0).max(100).optional(),
  valid_from: z.string().min(1).optional(),
  valid_until: z.string().optional(),
  special_conditions: z.string().optional(),
  product_template_ids: z.array(z.string().uuid()).min(1).optional(),
  justification: z.string().min(30).max(1000).optional(),
  expected_version: z.number().int().optional(),
})
export type UpdateFARequest = z.infer<typeof UpdateFARequestSchema>

// RHF-facing form schema for EditFrameworkAgreementDialog/EditFrameworkAgreementFields.
// Field constraints mirror UpdateFARequestSchema/FrameworkAgreementWizardFormSchema;
// justification is required+min(30) here (client-side rule) even though the wire schema
// keeps it optional (BE only requires it for active/suspended). expected_version is a
// hidden field seeded from FADetailResponse.edit_version_counter when the dialog opens.
export const EditFrameworkAgreementFormSchema = z
  .object({
    agreement_name: z.string().min(1, "required").max(200),
    // `{ error: "required" }` covers the missing/NaN case — an empty number input
    // registered with valueAsNumber yields NaN, and without this Zod's untranslated
    // default ("Invalid input: expected number, received NaN") reaches the UI.
    max_volume_eur: z.number({ error: "required" }).gt(0, "required"),
    effective_rate: z.number({ error: "required" }),
    vfe_rate: z.number().min(0).max(100).optional(),
    valid_from: z.string().min(1, "required"),
    valid_until: z.string().optional(),
    special_conditions: z.string().max(1000).optional(),
    product_template_ids: z.array(z.string()).min(1, "atLeastOneTemplate"),
    justification: z.string().min(30, "required").max(1000),
    expected_version: z.number().int(),
  })
  .superRefine((data, ctx) => {
    // `<=`, not `<`: UpdateFARequest rejects valid_until == valid_from
    // ("valid_until must be after valid_from"), so equal dates must fail here too
    // rather than reaching the API as a 422.
    if (
      data.valid_until !== undefined &&
      data.valid_until !== "" &&
      data.valid_until <= data.valid_from
    ) {
      ctx.addIssue({
        code: "custom",
        message: "validUntilBeforeFrom",
        path: ["valid_until"],
      })
    }
  })
export type EditFrameworkAgreementFormValues = z.infer<
  typeof EditFrameworkAgreementFormSchema
>

// POST /framework-agreements/{id}/activate
export const ActivateFARequestSchema = z.object({
  documents_confirmed: z.boolean(),
  effective_from: z.string().optional(),
  justification: z.string().min(20).max(1000),
})
export type ActivateFARequest = z.infer<typeof ActivateFARequestSchema>

// POST /framework-agreements/{id}/suspend
export const SuspendFARequestSchema = z.object({
  justification: z.string().min(20).max(1000),
  effective_from: z.string().nullable().optional(),
})
export type SuspendFARequest = z.infer<typeof SuspendFARequestSchema>

export const FASuspendedResponseSchema = z.object({
  id: z.string().uuid(),
  status: FALifecycleStatusSchema,
  suspended_at: z.string(),
})
export type FASuspendedResponse = z.infer<typeof FASuspendedResponseSchema>

// POST /framework-agreements/{id}/reactivate
export const ReactivateFARequestSchema = z.object({
  justification: z.string().min(20).max(1000),
  re_validation_confirmed: z.boolean(),
})
export type ReactivateFARequest = z.infer<typeof ReactivateFARequestSchema>

export const FAReactivatedResponseSchema = z.object({
  id: z.string().uuid(),
  status: FALifecycleStatusSchema,
  reactivated_at: z.string(),
})
export type FAReactivatedResponse = z.infer<typeof FAReactivatedResponseSchema>

// POST /framework-agreements/{id}/terminate
export const TerminateFARequestSchema = z.object({
  justification: z.string().min(30).max(1000),
  irreversibility_confirmed: z.boolean(),
})
export type TerminateFARequest = z.infer<typeof TerminateFARequestSchema>

export const FATerminatedResponseSchema = z.object({
  id: z.string().uuid(),
  status: FALifecycleStatusSchema,
  terminated_at: z.string(),
})
export type FATerminatedResponse = z.infer<typeof FATerminatedResponseSchema>

// GET /framework-agreements/{id}/termination-readiness
export const TerminationReadinessResponseSchema = z.object({
  can_terminate: z.boolean(),
  blocking_financing_count: z.number().int(),
  blocking_financings: z.array(z.unknown()),
})
export type TerminationReadinessResponse = z.infer<
  typeof TerminationReadinessResponseSchema
>

// GET /framework-agreements/{id}/utilization — only max_volume_eur is ever populated
// today (Limit Management/Epic 19 not built, `available` defaults false) — per
// phase-9a Q-022, the rest is typed but deliberately never rendered.
export const FAUtilizationResponseSchema = z.object({
  max_volume_eur: z.coerce.number(),
  disbursed_volume_eur: z.coerce.number().nullable(),
  redeemed_volume_eur: z.coerce.number().nullable(),
  net_exposure_eur: z.coerce.number().nullable(),
  available_volume_eur: z.coerce.number().nullable(),
  utilization_pct: z.coerce.number().nullable(),
  limit_available_flag: z.boolean().nullable(),
  limit_breach_flag: z.boolean().nullable(),
  last_refreshed_at: z.string().nullable(),
  source: z.string(),
  available: z.boolean(),
})
export type FAUtilizationResponse = z.infer<typeof FAUtilizationResponseSchema>

// GET /framework-agreements — utilization_pct/limit_breach are typed here (Limit Management
// stub always returns null today — see phase-9a Q-022) but are deliberately never rendered.
export const FAListItemSchema = z.object({
  id: z.string().uuid(),
  agreement_name: z.string(),
  lc_partner_id: z.string().uuid(),
  lc_partner_name: z.string().nullable(),
  bank_entity: BankEntitySchema.nullable(),
  status: FALifecycleStatusSchema,
  is_expired: z.boolean(),
  valid_from: z.string(),
  valid_until: z.string().nullable(),
  utilization_pct: z.coerce.number().nullable(),
  limit_breach: z.boolean().nullable(),
})
export type FAListItem = z.infer<typeof FAListItemSchema>

export const FAListResponseSchema = z.object({
  items: z.array(FAListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  per_page: z.number().int(),
  total_pages: z.number().int(),
})
export type FAListResponse = z.infer<typeof FAListResponseSchema>

export const FALCPartnerItemSchema = z.object({
  id: z.string().uuid(),
  legal_name: z.string(),
})
export type FALCPartnerItem = z.infer<typeof FALCPartnerItemSchema>

export const FALCPartnersResponseSchema = z.object({
  items: z.array(FALCPartnerItemSchema),
})
export type FALCPartnersResponse = z.infer<typeof FALCPartnersResponseSchema>

// GET /framework-agreements/{id} — role-scoped: pricing/lifecycle-actor/special_conditions
// fields are null for front_office/leasing_company_user/support_user (see phase-9a).
export const FADetailResponseSchema = z.object({
  id: z.string().uuid(),
  agreement_name: z.string(),
  lc_partner_id: z.string().uuid(),
  lc_partner_name: z.string().nullable(),
  status: FALifecycleStatusSchema,
  // Derived server-side from valid_until (CR PRD1042-1552 B2) — see is_fa_expired() in
  // refinext-api. FALifecycleStatus still has four values; expiry is never a wire status.
  is_expired: z.boolean(),
  currency: z.string(),
  max_volume_eur: z.coerce.number(),
  valid_from: z.string(),
  valid_until: z.string().nullable(),
  edit_version_counter: z.number().int(),
  product_template_ids: z.array(z.string().uuid()),
  document_count: z.number().int(),
  linked_financings_count: z.number().int(),
  utilization_pct: z.coerce.number().nullable(),
  limit_available: z.coerce.number().nullable(),
  limit_breach: z.boolean().nullable(),
  bank_entity: BankEntitySchema.nullable(),
  effective_rate: z.coerce.number().nullable(),
  vfe_rate: z.coerce.number().nullable(),
  special_conditions: z.string().nullable(),
  effective_from: z.string().nullable(),
  activated_at: z.string().nullable(),
  activated_by: z.string().uuid().nullable(),
  activated_by_name: z.string().nullable(),
  suspended_at: z.string().nullable(),
  suspended_by: z.string().uuid().nullable(),
  terminated_at: z.string().nullable(),
  terminated_by: z.string().uuid().nullable(),
  created_by: z.string().uuid().nullable(),
  created_by_name: z.string().nullable(),
  created_at: z.string(),
})
export type FADetailResponse = z.infer<typeof FADetailResponseSchema>

// GET /framework-agreements/{id}/financings — always empty today, no Financing module exists
export const FALinkedFinancingsResponseSchema = z.object({
  count: z.number().int(),
  items: z.array(z.unknown()),
})
export type FALinkedFinancingsResponse = z.infer<
  typeof FALinkedFinancingsResponseSchema
>

// Wire enum for the audit-history `type[]` filter — matches FAEventTypeFilter in
// refinext-api fa_schemas.py exactly.
export const FAEventTypeFilterSchema = z.enum([
  "draft_created",
  "draft_edited",
  "draft_deleted",
  "document_attached",
  "document_detached",
  "document_downloaded",
  "activation_submitted",
  "activated",
  "activation_rejected",
  "activation_expired",
  "suspended",
  "suspension_blocked",
  "reactivated",
  "terminated",
  "termination_blocked",
  "edited",
  "max_volume_reduced_below_exposure",
  "list_accessed",
  "detail_accessed",
  "pricing_snapshot_accessed",
  "auditor_audit_access",
  "audit_export",
])
export type FAEventTypeFilter = z.infer<typeof FAEventTypeFilterSchema>

export const FieldDiffItemSchema = z.object({
  field: z.string(),
  old_value: z.unknown().nullable(),
  new_value: z.unknown().nullable(),
})
export type FieldDiffItem = z.infer<typeof FieldDiffItemSchema>

// GET /framework-agreements/{id}/audit-history — cursor-paginated event timeline.
export const FAAuditEventResponseSchema = z.object({
  id: z.string().uuid(),
  event_type: z.string(),
  actor_id: z.string().uuid().nullable(),
  actor_first_name: z.string().nullable(),
  actor_last_name: z.string().nullable(),
  actor_type: z.string(),
  recorded_at: z.string(),
  justification: z.string().nullable(),
  old_data: z.record(z.string(), z.unknown()).nullable(),
  new_data: z.record(z.string(), z.unknown()).nullable(),
  changed_fields: z.array(z.string()).nullable(),
  field_diffs: z.array(FieldDiffItemSchema).nullable(),
})
export type FAAuditEventResponse = z.infer<typeof FAAuditEventResponseSchema>

export const FAAuditHistoryResponseSchema = z.object({
  items: z.array(FAAuditEventResponseSchema),
  next_cursor: z.string().nullable(),
})
export type FAAuditHistoryResponse = z.infer<
  typeof FAAuditHistoryResponseSchema
>

// GET /framework-agreements/{id}/reconstruct — `state` is an untyped snapshot
// (BE replays the live audit trail, see phase-9c note); rendered generically.
export const FAReconstructResponseSchema = z.object({
  fa_id: z.string().uuid(),
  as_of: z.string(),
  events_replayed: z.number().int(),
  state: z.record(z.string(), z.unknown()),
})
export type FAReconstructResponse = z.infer<typeof FAReconstructResponseSchema>

// GET /product-templates/selectable — reused from the Bank Product Template epic
export const SelectableTemplateItemSchema = z.object({
  template_id: z.string().uuid(),
  template_name: z.string(),
  version_number: z.string(),
})
export type SelectableTemplateItem = z.infer<
  typeof SelectableTemplateItemSchema
>

export const SelectableTemplatesResponseSchema = z.object({
  items: z.array(SelectableTemplateItemSchema),
})
export type SelectableTemplatesResponse = z.infer<
  typeof SelectableTemplatesResponseSchema
>

// POST /framework-agreements/{fa_id}/documents
export const AttachDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  framework_agreement_id: z.string().uuid(),
  document_type: FADocumentTypeSchema,
  document_label: z.string().nullable(),
  file_name: z.string(),
  file_size_bytes: z.number().int(),
  mime_type: z.string(),
  lc_visible: z.boolean(),
  uploaded_by: z.string().uuid(),
  uploaded_at: z.string(),
})
export type AttachDocumentResponse = z.infer<
  typeof AttachDocumentResponseSchema
>

// GET /framework-agreements/{fa_id}/documents — bare array (not {items:[...]}).
// DocumentListItemResponse on the BE is byte-for-byte identical to
// AttachDocumentResponse, so reuse it rather than duplicating the shape.
export const FADocumentListResponseSchema = z.array(
  AttachDocumentResponseSchema
)
export type FADocumentListResponse = z.infer<
  typeof FADocumentListResponseSchema
>

// GET /framework-agreements/{fa_id}/documents/{doc_id}/download-url
export const DownloadURLResponseSchema = z.object({
  url: z.string(),
  expires_in_seconds: z.number().int(),
})
export type DownloadURLResponse = z.infer<typeof DownloadURLResponseSchema>

// RHF-facing form schema — every field required across all 6 wizard steps, since
// CreateFARequest hard-requires the full set on a single POST (no partial-draft
// concept, unlike the Bank Product Template wizard).
export const FrameworkAgreementWizardFormSchema = z
  .object({
    agreement_name: z.string().min(1, "required").max(200),
    lc_partner_id: z.string().min(1, "required"),
    lc_partner_name: z.string().optional(),
    bank_entity: requiredEnum(BankEntitySchema.options),
    // See EditFrameworkAgreementFormSchema — `{ error: "required" }` keeps Zod's
    // untranslated NaN/undefined message out of the UI for empty number inputs.
    max_volume_eur: z.number({ error: "required" }).gt(0, "required"),
    effective_rate: z.number({ error: "required" }),
    vfe_rate: z.number().min(0).max(100).optional(),
    valid_from: z.string().min(1, "required"),
    valid_until: z.string().optional(),
    special_conditions: z.string().max(1000).optional(),
    product_template_ids: z.array(z.string()).min(1, "atLeastOneTemplate"),
  })
  .superRefine((data, ctx) => {
    // `<=` mirrors CreateFARequest's own validator (valid_until must be *after*
    // valid_from) — with `<`, equal dates passed the FE and 422'd at the API.
    if (
      data.valid_until !== undefined &&
      data.valid_until !== "" &&
      data.valid_until <= data.valid_from
    ) {
      ctx.addIssue({
        code: "custom",
        message: "validUntilBeforeFrom",
        path: ["valid_until"],
      })
    }
  })
export type FrameworkAgreementWizardForm = z.infer<
  typeof FrameworkAgreementWizardFormSchema
>
