import { z } from "zod"
import { requiredEnum, requiredNumber } from "@/lib/zodHelpers"
import { FieldDiffItemSchema } from "@/types/api"

// Wire enums — must match refinext-api src/app/modules/framework_agreements/domain/enums.py exactly
export const FALifecycleStatusSchema = z.enum([
  "draft",
  "active",
  "deactivated",
  "terminated",
])
export type FALifecycleStatus = z.infer<typeof FALifecycleStatusSchema>

// The agreement's displayable lifecycle — CR-FA-07 on PRD1042-1799 as revised 6/8/2026:
// Draft (discardable), Active, Deactivated, Expired, Terminated. No Superseded, because
// CR-FA-04 was withdrawn and the agreement is not versioned; no Scheduled, which the CR
// leaves open and the wire does not offer (see open-questions Q-075). `deactivated` is the
// switched-off state added by PRD1042-1891 §3 and takes precedence over `expired` — the
// backend computes that precedence, the FE just renders whichever value it receives.
//
// Distinct from FALifecycleStatus above, and the two are not interchangeable:
//
//   FALifecycleStatus  — the *stored* status, and the only thing the list endpoint's
//                        `status` filter accepts. Gates which actions are offered.
//   FAAgreementLifecycle — the *displayed* state, computed server-side by folding
//                        `is_expired` into the stored status. Never sent back to the API.
//
// So an expired agreement is `expired` here and still `active` there, which is why the
// action gates on the detail page continue to read `status` — an expired agreement can
// still be terminated.
export const FAAgreementLifecycleSchema = z.enum([
  "draft",
  "active",
  "deactivated",
  "terminated",
  "expired",
])
export type FAAgreementLifecycle = z.infer<typeof FAAgreementLifecycleSchema>

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

// The early-repayment penalty is an absolute EUR amount, not a percentage — CR-FA-02 on
// PRD1042-1799, landed on the wire as `vfe_amount_eur` with no upper bound (the old
// `vfe_rate` was capped at 100 because it was a percent).
export const VFE_AMOUNT_MIN = 0

// `effective_rate` is deliberately absent from every schema below. CR-FA-01 removed it from
// the agreement and the backend has already dropped it from create, update, the detail and
// draft responses and the pricing snapshot. CR-BPT-02 moved it to the Bank Product Template,
// which now carries it on create, update and the version detail response — see
// `effective_rate` in features/productTemplates/api/schema.ts. Do not reintroduce it here:
// the rate is a product-level parameter that the agreement reads through its template.
// Historical values used to survive on FAVersionDetailResponse; that schema went with
// CR-FA-04's withdrawal (see the note further down), so the audit-history reconstruct path
// is now the only place pre-change `effective_rate` / `vfe_rate` values surface.

// POST /framework-agreements — matches CreateFARequest in refinext-api fa_schemas.py exactly
export const CreateFARequestSchema = z.object({
  agreement_name: z.string().min(1).max(200),
  lc_partner_id: z.string().uuid(),
  bank_entity: BankEntitySchema,
  max_volume_eur: z.number().gt(0),
  // VFE (early-repayment penalty) amount in EUR — optional; the BE prefills from the
  // per-LC default on create. Matches CreateFARequest.vfe_amount_eur.
  vfe_amount_eur: z.number().min(VFE_AMOUNT_MIN).optional(),
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
  vfe_amount_eur: z.coerce.number().nullable(),
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
// sends them in that case, see editWizard.buildUpdateFAPayload). justification/
// expected_version are governed-edit-only on the BE but harmless to always send.
export const UpdateFARequestSchema = z.object({
  agreement_name: z.string().min(1).max(200).optional(),
  max_volume_eur: z.number().gt(0).optional(),
  vfe_amount_eur: z.number().min(VFE_AMOUNT_MIN).optional(),
  valid_from: z.string().min(1).optional(),
  valid_until: z.string().optional(),
  special_conditions: z.string().optional(),
  product_template_ids: z.array(z.string().uuid()).min(1).optional(),
  justification: z.string().min(30).max(1000).optional(),
  expected_version: z.number().int().optional(),
})
export type UpdateFARequest = z.infer<typeof UpdateFARequestSchema>

// RHF-facing form schema for EditFrameworkAgreementWizardPage and its steps.
// Field constraints mirror UpdateFARequestSchema/FrameworkAgreementWizardFormSchema;
// justification is required+min(30) here (client-side rule) even though the wire schema
// keeps it optional (BE only requires it for active). expected_version is a
// hidden field seeded from FADetailResponse.edit_version_counter when the dialog opens.
export const EditFrameworkAgreementFormSchema = z
  .object({
    agreement_name: z.string().min(1, "required").max(200, "tooLong"),
    // requiredNumber() covers the missing/NaN case — an empty number input registered
    // with valueAsNumber yields NaN, and a bare z.number() would put Zod's untranslated
    // default ("Invalid input: expected number, received NaN") in front of the user.
    // The bound carries its own code: a typed "-3" is not a missing value.
    max_volume_eur: requiredNumber().gt(0, "mustBePositive"),
    vfe_amount_eur: z.number().min(VFE_AMOUNT_MIN, "vfeAmountMin").optional(),
    valid_from: z.string().min(1, "required"),
    valid_until: z.string().optional(),
    special_conditions: z.string().max(1000, "tooLong").optional(),
    product_template_ids: z.array(z.string()).min(1, "atLeastOneTemplate"),
    justification: z.string().min(30, "required").max(1000, "tooLong"),
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
// PRD1042-1703 #4: activation is immediate, mirroring the Bank Product Template publish
// flow — no effective_from input, no scheduled job. The BE dropped the field entirely.
// The justification bounds carry message codes because this schema doubles as the
// activation panel's form schema — without them Zod's untranslated "Too small: expected
// string to have >=20 characters" reaches the user (see lib/formMessages.ts).
export const ActivateFARequestSchema = z.object({
  documents_confirmed: z.boolean(),
  justification: z.string().min(20, "tooShort").max(1000, "tooLong"),
})
export type ActivateFARequest = z.infer<typeof ActivateFARequestSchema>

// POST /framework-agreements/{id}/terminate
// Message codes for the same reason as ActivateFARequestSchema above — this is also the
// termination panel's form schema.
export const TerminateFARequestSchema = z.object({
  justification: z.string().min(30, "tooShort").max(1000, "tooLong"),
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
  // What the status column renders (CR-FA-07). Kept alongside `status`, which the list
  // filter still round-trips — the filter cannot express `expired`, see Q-076.
  agreement_lifecycle: FAAgreementLifecycleSchema,
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

// GET /framework-agreements/{id} — role-scoped, but not uniformly: the BE applies four
// separate rules (fa_schemas.py, FADetailResponse.from_entity).
//   pricing (vfe_amount_eur) + bank-internal fields → hidden from leasing_company_user ONLY.
//     front_office is a bank operational role and reads pricing to assemble financings.
//   special_conditions, lifecycle timestamps, actor refs → hidden from front_office,
//     leasing_company_user and support_user.
// Do not collapse these into one list: an earlier version of this comment claimed pricing
// was nulled for front_office, which made PRD1042-1707 look like backend work when the
// gap was entirely in this repo's UI.
export const FADetailResponseSchema = z.object({
  id: z.string().uuid(),
  agreement_name: z.string(),
  lc_partner_id: z.string().uuid(),
  lc_partner_name: z.string().nullable(),
  status: FALifecycleStatusSchema,
  // Derived server-side from valid_until (CR PRD1042-1552 B2) — see is_fa_expired() in
  // refinext-api. Retained because the LC portal still needs the raw flag; on this response
  // it is already folded into `agreement_lifecycle` below, which is what the UI renders.
  is_expired: z.boolean(),
  // CR-FA-07 as revised 6/8/2026 — the agreement's four-state displayable lifecycle. The
  // frontend used to recompute this from status + is_expired; the server owns the rule.
  agreement_lifecycle: FAAgreementLifecycleSchema,
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
  vfe_amount_eur: z.coerce.number().nullable(),
  special_conditions: z.string().nullable(),
  effective_from: z.string().nullable(),
  activated_at: z.string().nullable(),
  activated_by: z.string().uuid().nullable(),
  activated_by_name: z.string().nullable(),
  // Renamed from suspended_at/suspended_by (PRD1042-1891 §3) — reactivated_at/_by are new,
  // set when a deactivated agreement is reactivated.
  deactivated_at: z.string().nullable(),
  deactivated_by: z.string().uuid().nullable(),
  reactivated_at: z.string().nullable(),
  reactivated_by: z.string().uuid().nullable(),
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

// Shared with audit's and productTemplates' diff responses — defined once in @/types/api,
// re-exported here so existing import paths keep working.
export { FieldDiffItemSchema }
export type { FieldDiffItem } from "@/types/api"

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

// FA versioning schemas (FAVersionSummaryResponse / FAVersionListResponse /
// FAVersionDetailResponse / FAVersionDiffResponse) were removed here: CR-FA-04 on
// PRD1042-1799 was **withdrawn by the client on 6/8/2026** — "The Framework Agreement is
// not versioned. When an agreement ends, a successor record is created, and the overlap
// lock in CR-FA-10 enforces one active agreement per leasing company."
//
// The backend still exposes /versions, /versions/{id}/activate and /diff; they are
// deliberately unconsumed rather than wrapped (see open-questions Q-072). Two things the
// CR says must survive the removal, and did: the agreement's own lifecycle
// (FAAgreementLifecycleSchema, CR-FA-07) and the pinned product template version
// (CR-FA-05, still backend-blocked — Q-063/Q-068).
//
// `effective_rate` and `vfe_rate` historical values lived only on FAVersionDetailResponse
// and are gone with it; the audit-history reconstruct path still surfaces them.

// GET /product-templates/selectable — reused from the Bank Product Template epic
export const SelectableTemplateItemSchema = z.object({
  template_id: z.string().uuid(),
  // Required on SelectableTemplateItem in openapi.json. Carried because the picker's
  // search matches it as well as the name — a Bank Admin looking through 20-30 templates
  // may know either (CR PRD1042-1799 CR-FA-05).
  template_code: z.string(),
  template_name: z.string(),
  version_number: z.string(),
  // Required on the wire (SelectableTemplateItem in openapi.json), value nullable. Drives the
  // Create wizard's eligibility filter in ProductTemplateMultiSelect — see
  // filterTemplatesEffectiveBy in utils.ts.
  valid_from: z.string().nullable(),
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
    agreement_name: z.string().min(1, "required").max(200, "tooLong"),
    lc_partner_id: z.string().min(1, "required"),
    lc_partner_name: z.string().optional(),
    bank_entity: requiredEnum(BankEntitySchema.options),
    // See EditFrameworkAgreementFormSchema — requiredNumber() keeps Zod's untranslated
    // NaN/undefined message out of the UI for empty number inputs.
    max_volume_eur: requiredNumber().gt(0, "mustBePositive"),
    vfe_amount_eur: z.number().min(VFE_AMOUNT_MIN, "vfeAmountMin").optional(),
    valid_from: z.string().min(1, "required"),
    valid_until: z.string().optional(),
    special_conditions: z.string().max(1000, "tooLong").optional(),
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
