import { z } from "zod"

// ── Enums ────────────────────────────────────────────────────────────────────

export const PartnerTypeSchema = z.enum([
  "legal_entity",
  "natural_person",
  "sole_proprietor",
])
export type PartnerType = z.infer<typeof PartnerTypeSchema>

export const PartnerStatusSchema = z.enum([
  "draft",
  "pending_confirmation",
  "confirmed",
  "rejected",
  "merged",
  "archived",
  "pending_archive",
])
export type PartnerStatus = z.infer<typeof PartnerStatusSchema>

export const PartnerRoleSchema = z.enum([
  "lessee",
  "guarantor",
  "supplier",
  "leasing_company",
  "bank_entity",
  "ubo_related_person",
])
export type PartnerRole = z.infer<typeof PartnerRoleSchema>

export const NonRiskPartnerRoleSchema = z.enum([
  "lessee",
  "guarantor",
  "supplier",
])
export type NonRiskPartnerRole = z.infer<typeof NonRiskPartnerRoleSchema>

export const RoleStatusSchema = z.enum([
  "active",
  "pending_four_eyes",
  "rejected",
  "withdrawn",
])
export type RoleStatus = z.infer<typeof RoleStatusSchema>

export const UboCompletenessStatusSchema = z.enum([
  "missing",
  "partial",
  "complete",
])
export type UboCompletenessStatus = z.infer<typeof UboCompletenessStatusSchema>

export const IdentityChangeStatusSchema = z.enum([
  "pending_four_eyes",
  "committed",
  "rejected",
])
export type IdentityChangeStatus = z.infer<typeof IdentityChangeStatusSchema>

// ── Shared sub-schemas ────────────────────────────────────────────────────────

export const RegisteredAddressSchema = z.object({
  street: z.string().nullable(),
  city: z.string().nullable(),
  postal_code: z.string().nullable(),
  country: z.string().nullable(),
})
export type RegisteredAddress = z.infer<typeof RegisteredAddressSchema>

// ── Identity detail (read, discriminated by partner_type) ─────────────────────

export const LegalEntityIdentityDetailSchema = z.object({
  partner_type: z.literal("legal_entity"),
  legal_name: z.string(),
  legal_form: z.string().nullable(),
  country: z.string(),
  tax_id_vat: z.string().nullable(),
  lei: z.string().nullable(),
  commercial_register_no: z.string().nullable(),
  registered_address: RegisteredAddressSchema.nullable(),
  foreign_identifier: z.string().nullable(),
})
export type LegalEntityIdentityDetail = z.infer<
  typeof LegalEntityIdentityDetailSchema
>

export const NaturalPersonIdentityDetailSchema = z.object({
  partner_type: z.literal("natural_person"),
  full_name: z.string(),
  date_of_birth: z.string(),
  place_of_birth: z.string(),
  country: z.string(),
  birth_name: z.string().nullable(),
  national_id: z.string().nullable(),
  registered_address: RegisteredAddressSchema.nullable(),
})
export type NaturalPersonIdentityDetail = z.infer<
  typeof NaturalPersonIdentityDetailSchema
>

export const SoleProprietorIdentityDetailSchema = z.object({
  partner_type: z.literal("sole_proprietor"),
  full_name: z.string(),
  date_of_birth: z.string(),
  country: z.string(),
  tax_id_vat: z.string().nullable(),
  commercial_register_no: z.string().nullable(),
  registered_address: RegisteredAddressSchema.nullable(),
})
export type SoleProprietorIdentityDetail = z.infer<
  typeof SoleProprietorIdentityDetailSchema
>

export const PartnerIdentityDetailSchema = z.discriminatedUnion(
  "partner_type",
  [
    LegalEntityIdentityDetailSchema,
    NaturalPersonIdentityDetailSchema,
    SoleProprietorIdentityDetailSchema,
  ]
)
export type PartnerIdentityDetail = z.infer<typeof PartnerIdentityDetailSchema>

// ── Match / Submit ────────────────────────────────────────────────────────────

export const CandidateSummarySchema = z.object({
  partner_id: z.string().uuid(),
  display_name: z.string(),
  partner_type: PartnerTypeSchema,
  status: z.string(),
  matched_anchors: z.array(z.string()),
  confidence: z.string(),
})
export type CandidateSummary = z.infer<typeof CandidateSummarySchema>

export const PartnerMatchResponseSchema = z.object({
  classification: z.string(),
  confidence: z.string().nullable(),
  matched_partner_id: z.string().uuid().nullable(),
  candidate_summaries: z.array(CandidateSummarySchema),
  inputs_hash: z.string(),
})
export type PartnerMatchResponse = z.infer<typeof PartnerMatchResponseSchema>

export const PartnerSubmitResponseSchema = z.object({
  partner_id: z.string().uuid(),
  display_name: z.string(),
  partner_type: PartnerTypeSchema,
  status: PartnerStatusSchema,
  role: PartnerRoleSchema,
  is_new: z.boolean(),
})
export type PartnerSubmitResponse = z.infer<typeof PartnerSubmitResponseSchema>

// ── List ──────────────────────────────────────────────────────────────────────

export const PartnerListItemSchema = z.object({
  partner_id: z.string().uuid(),
  display_name: z.string(),
  partner_type: PartnerTypeSchema,
  status: PartnerStatusSchema,
  country: z.string().nullable(),
  ubo_completeness_status: UboCompletenessStatusSchema,
  roles: z.array(PartnerRoleSchema),
})
export type PartnerListItem = z.infer<typeof PartnerListItemSchema>

export const PartnerListResponseSchema = z.object({
  items: z.array(PartnerListItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})
export type PartnerListResponse = z.infer<typeof PartnerListResponseSchema>

// ── Detail ────────────────────────────────────────────────────────────────────

export const PartnerDetailResponseSchema = z.object({
  partner_id: z.string().uuid(),
  display_name: z.string(),
  partner_type: PartnerTypeSchema,
  status: PartnerStatusSchema,
  ubo_completeness_status: UboCompletenessStatusSchema,
  identity: PartnerIdentityDetailSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
export type PartnerDetailResponse = z.infer<typeof PartnerDetailResponseSchema>

// ── Resolution candidates ─────────────────────────────────────────────────────

export const ResolutionEventSummarySchema = z.object({
  classification: z.string(),
  confidence: z.string().nullable(),
  matched_anchors: z.record(z.string(), z.unknown()),
  candidate_partner_ids: z.array(z.string()),
  inputs_hash: z.string(),
  resolved_at: z.string().datetime(),
})
export type ResolutionEventSummary = z.infer<
  typeof ResolutionEventSummarySchema
>

export const ResolutionCandidatesResponseSchema = z.object({
  partner_id: z.string().uuid(),
  status: z.string(),
  resolution: ResolutionEventSummarySchema.nullable(),
  candidates: z.array(CandidateSummarySchema),
})
export type ResolutionCandidatesResponse = z.infer<
  typeof ResolutionCandidatesResponseSchema
>

// ── Roles ─────────────────────────────────────────────────────────────────────

export const ActorSummarySchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string(),
  email: z.string().email(),
})
export type ActorSummary = z.infer<typeof ActorSummarySchema>

export const RoleAssignmentSummarySchema = z.object({
  role_assignment_id: z.string().uuid(),
  role: PartnerRoleSchema,
  status: RoleStatusSchema,
  is_risk_sensitive: z.boolean(),
  assigned_by: ActorSummarySchema,
  assigned_at: z.string().datetime(),
  note: z.string().nullable(),
  governed_action_id: z.string().uuid().nullable().optional(),
})
export type RoleAssignmentSummary = z.infer<typeof RoleAssignmentSummarySchema>

export const RoleHistoryEntrySchema = z.object({
  role_assignment_id: z.string().uuid(),
  actor: ActorSummarySchema,
  actor_role: z.string(),
  description_key: z.string(),
  description_params: z.record(z.string(), z.unknown()),
  timestamp: z.string().datetime(),
})
export type RoleHistoryEntry = z.infer<typeof RoleHistoryEntrySchema>

export const PartnerRolesResponseSchema = z.object({
  partner_id: z.string().uuid(),
  roles: z.array(RoleAssignmentSummarySchema),
  history: z.array(RoleHistoryEntrySchema),
})
export type PartnerRolesResponse = z.infer<typeof PartnerRolesResponseSchema>

export const RoleAssignResultSchema = z.object({
  role: PartnerRoleSchema,
  status: RoleStatusSchema,
  is_new: z.boolean(),
})
export type RoleAssignResult = z.infer<typeof RoleAssignResultSchema>

export const RoleAssignResponseSchema = z.object({
  results: z.array(RoleAssignResultSchema),
})
export type RoleAssignResponse = z.infer<typeof RoleAssignResponseSchema>

// ── UBO ───────────────────────────────────────────────────────────────────────

export const UboOwnershipRecordResponseSchema = z.object({
  id: z.string().uuid(),
  ubo_partner_id: z.string().uuid(),
  ubo_display_name: z.string(),
  ownership_percentage: z.string(),
  ownership_type: z.string(),
  indirect_ownership_notes: z.string().nullable(),
  captured_by: ActorSummarySchema,
  captured_at: z.string().datetime(),
})
export type UboOwnershipRecordResponse = z.infer<
  typeof UboOwnershipRecordResponseSchema
>

export const PartnerUboResponseSchema = z.object({
  ubo_completeness_status: UboCompletenessStatusSchema,
  records: z.array(UboOwnershipRecordResponseSchema),
})
export type PartnerUboResponse = z.infer<typeof PartnerUboResponseSchema>

// ── Confirmation history ──────────────────────────────────────────────────────

export const ConfirmationHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  captured_by: z.string(),
  captured_on: z.string().datetime(),
  note: z.string().nullable(),
})
export type ConfirmationHistoryEntry = z.infer<
  typeof ConfirmationHistoryEntrySchema
>

export const ConfirmationHistoryResponseSchema = z.object({
  items: z.array(ConfirmationHistoryEntrySchema),
  next_cursor: z.string().nullable(),
})
export type ConfirmationHistoryResponse = z.infer<
  typeof ConfirmationHistoryResponseSchema
>

// ── Decision history ──────────────────────────────────────────────────────────

export const DecisionHistoryEntrySchema = z.object({
  event_type: z.string(),
  action_type: z.string(),
  actor_id: z.string().nullable(),
  actor_display: z.string().nullable(),
  actor_type: z.string().nullable(),
  occurred_at: z.string().datetime(),
  old_data: z.record(z.string(), z.unknown()).nullable(),
  new_data: z.record(z.string(), z.unknown()).nullable(),
  trigger_source: z.string().nullable(),
})
export type DecisionHistoryEntry = z.infer<typeof DecisionHistoryEntrySchema>

export const DecisionHistoryResponseSchema = z.object({
  items: z.array(DecisionHistoryEntrySchema),
  next_cursor: z.string().nullable(),
})
export type DecisionHistoryResponse = z.infer<
  typeof DecisionHistoryResponseSchema
>

// ── Archive ───────────────────────────────────────────────────────────────────

export const ArchiveEligibilityResponseSchema = z.object({
  can_archive: z.boolean(),
  active_references: z.array(z.record(z.string(), z.unknown())),
  requires_counter_confirmation: z.boolean(),
  risk_sensitive_roles: z.array(z.string()),
})
export type ArchiveEligibilityResponse = z.infer<
  typeof ArchiveEligibilityResponseSchema
>

export const ArchivePartnerResponseSchema = z.object({
  partner_id: z.string().uuid(),
  status: PartnerStatusSchema,
  is_immediate: z.boolean(),
  governed_action_id: z.string().uuid().nullable().optional(),
})
export type ArchivePartnerResponse = z.infer<
  typeof ArchivePartnerResponseSchema
>

// ── Identity changes ──────────────────────────────────────────────────────────

export const DownstreamImpactSchema = z.object({
  refinancing_requests: z.number().int().default(0),
  contracts: z.number().int().default(0),
  financings: z.number().int().default(0),
})
export type DownstreamImpact = z.infer<typeof DownstreamImpactSchema>

export const IdentityChangeActorSummarySchema = z.object({
  user_id: z.string(),
  display_name: z.string(),
  role: z.string(),
})
export type IdentityChangeActorSummary = z.infer<
  typeof IdentityChangeActorSummarySchema
>

export const IdentityChangeProposeResponseSchema = z.object({
  identity_change_id: z.string(),
  partner_id: z.string(),
  status: IdentityChangeStatusSchema,
  is_high_risk: z.boolean(),
  downstream_impact: DownstreamImpactSchema,
})
export type IdentityChangeProposeResponse = z.infer<
  typeof IdentityChangeProposeResponseSchema
>

export const IdentityHistoryItemSchema = z.object({
  identity_change_id: z.string(),
  target_anchors: z.array(z.string()),
  pre_change_snapshot: z.record(z.string(), z.unknown()),
  proposed_values: z.record(z.string(), z.unknown()),
  change_reason: z.string(),
  is_high_risk: z.boolean(),
  status: IdentityChangeStatusSchema,
  proposed_by: IdentityChangeActorSummarySchema,
  proposed_at: z.string().datetime(),
  resolved_at: z.string().datetime().nullable(),
  counter_confirmed_by: IdentityChangeActorSummarySchema.nullable(),
})
export type IdentityHistoryItem = z.infer<typeof IdentityHistoryItemSchema>

export const IdentityHistoryResponseSchema = z.object({
  partner_id: z.string(),
  items: z.array(IdentityHistoryItemSchema),
})
export type IdentityHistoryResponse = z.infer<
  typeof IdentityHistoryResponseSchema
>

export const IdentityChangeDetailResponseSchema = z.object({
  identity_change_id: z.string(),
  partner_id: z.string(),
  status: IdentityChangeStatusSchema,
  is_high_risk: z.boolean(),
  target_anchors: z.array(z.string()),
  pre_change_snapshot: z.record(z.string(), z.unknown()),
  proposed_values: z.record(z.string(), z.unknown()),
  change_reason: z.string(),
  proposed_by: IdentityChangeActorSummarySchema,
  proposed_at: z.string().datetime(),
  resolved_at: z.string().datetime().nullable(),
  counter_confirmed_by: IdentityChangeActorSummarySchema.nullable(),
  downstream_impact: DownstreamImpactSchema,
})
export type IdentityChangeDetailResponse = z.infer<
  typeof IdentityChangeDetailResponseSchema
>
