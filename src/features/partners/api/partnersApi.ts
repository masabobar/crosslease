import { api } from "@/lib/api"
import {
  ArchiveEligibilityResponseSchema,
  ArchivePartnerResponseSchema,
  ConfirmationHistoryResponseSchema,
  DecisionHistoryResponseSchema,
  IdentityChangeDetailResponseSchema,
  IdentityChangeProposeResponseSchema,
  IdentityHistoryResponseSchema,
  PartnerDetailResponseSchema,
  PartnerListResponseSchema,
  PartnerMatchResponseSchema,
  PartnerRolesResponseSchema,
  PartnerSubmitResponseSchema,
  PartnerUboResponseSchema,
  ResolutionCandidatesResponseSchema,
  RoleAssignResponseSchema,
  UboOwnershipRecordResponseSchema,
} from "./schema"
import type {
  ArchiveEligibilityResponse,
  ArchivePartnerResponse,
  ConfirmationHistoryResponse,
  DecisionHistoryResponse,
  IdentityChangeDetailResponse,
  IdentityChangeProposeResponse,
  IdentityHistoryResponse,
  PartnerDetailResponse,
  PartnerListResponse,
  PartnerMatchResponse,
  PartnerRole,
  PartnerRolesResponse,
  PartnerStatus,
  PartnerSubmitResponse,
  PartnerType,
  PartnerUboResponse,
  ResolutionCandidatesResponse,
  RoleAssignResponse,
  UboCompletenessStatus,
  UboOwnershipRecordResponse,
} from "./schema"

// ── Query keys ────────────────────────────────────────────────────────────────

export type PartnerListParams = {
  search?: string | null
  status?: PartnerStatus[]
  role?: PartnerRole[]
  country?: string[]
  ubo_status?: UboCompletenessStatus[]
  limit?: number
  offset?: number
}

export const PARTNERS_QUERY_KEYS = {
  list: (tenantId: string | null, params?: PartnerListParams) =>
    ["partners", "list", tenantId, params] as const,
  detail: (id: string) => ["partners", "detail", id] as const,
  resolutionCandidates: (id: string) =>
    ["partners", "resolution-candidates", id] as const,
  roles: (id: string) => ["partners", "roles", id] as const,
  ubo: (id: string) => ["partners", "ubo", id] as const,
  confirmationHistory: (id: string, cursor?: string | null) =>
    ["partners", "confirmation-history", id, cursor] as const,
  decisionHistory: (id: string, cursor?: string | null) =>
    ["partners", "decision-history", id, cursor] as const,
  archiveEligibility: (id: string) =>
    ["partners", "archive-eligibility", id] as const,
  identityHistory: (id: string) =>
    ["partners", "identity-history", id] as const,
  identityChangeDetail: (id: string, changeId: string) =>
    ["partners", "identity-change", id, changeId] as const,
} as const

// ── Identity input types (for forms) ─────────────────────────────────────────

export type RegisteredAddressInput = {
  street?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
}

export type LegalEntityIdentityInput = {
  partner_type: "legal_entity"
  legal_name: string
  legal_form?: string | null
  country: string
  tax_id_vat?: string | null
  lei?: string | null
  commercial_register_no?: string | null
  registered_address?: RegisteredAddressInput | null
  foreign_identifier?: string | null
}

export type NaturalPersonIdentityInput = {
  partner_type: "natural_person"
  full_name: string
  date_of_birth: string
  place_of_birth: string
  country: string
  birth_name?: string | null
  national_id?: string | null
  registered_address?: RegisteredAddressInput | null
}

export type SoleProprietorIdentityInput = {
  partner_type: "sole_proprietor"
  full_name: string
  date_of_birth: string
  country: string
  tax_id_vat?: string | null
  commercial_register_no?: string | null
  registered_address?: RegisteredAddressInput | null
}

export type PartnerIdentityInput =
  | LegalEntityIdentityInput
  | NaturalPersonIdentityInput
  | SoleProprietorIdentityInput

export type MatchPartnerBody = {
  identity: PartnerIdentityInput
}

export type SubmitPartnerBody = {
  identity: PartnerIdentityInput
  roles: PartnerRole[]
}

export type AssignRolesBody = {
  roles: Array<"lessee" | "guarantor" | "supplier">
  note?: string | null
}

export type CaptureUboBody = {
  ubo_partner_id: string
  ownership_percentage: number
  ownership_type: "direct"
  indirect_ownership_notes?: string | null
}

export type ArchivePartnerBody = {
  reason: string
}

export type ProposeIdentityChangeBody = {
  target_anchors: string[]
  proposed_values: Record<string, unknown>
  change_reason: string
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchPartners(
  tenantId: string,
  params?: PartnerListParams
): Promise<PartnerListResponse> {
  const data = await api.get(`/tenants/${tenantId}/partners`, { params })
  return PartnerListResponseSchema.parse(data)
}

export async function fetchPartner(id: string): Promise<PartnerDetailResponse> {
  const data = await api.get(`/partners/${id}`)
  return PartnerDetailResponseSchema.parse(data)
}

export async function matchPartner(
  tenantId: string,
  body: MatchPartnerBody
): Promise<PartnerMatchResponse> {
  const data = await api.post(`/tenants/${tenantId}/partners/match`, body)
  return PartnerMatchResponseSchema.parse(data)
}

export async function submitPartner(
  tenantId: string,
  body: SubmitPartnerBody
): Promise<PartnerSubmitResponse> {
  const data = await api.post(`/tenants/${tenantId}/partners`, body)
  return PartnerSubmitResponseSchema.parse(data)
}

export async function fetchResolutionCandidates(
  id: string
): Promise<ResolutionCandidatesResponse> {
  const data = await api.get(`/partners/${id}/resolution-candidates`)
  return ResolutionCandidatesResponseSchema.parse(data)
}

export async function fetchPartnerRoles(
  id: string
): Promise<PartnerRolesResponse> {
  const data = await api.get(`/partners/${id}/roles`)
  return PartnerRolesResponseSchema.parse(data)
}

export async function assignPartnerRoles(
  id: string,
  body: AssignRolesBody
): Promise<RoleAssignResponse> {
  const data = await api.post(`/partners/${id}/roles`, body)
  return RoleAssignResponseSchema.parse(data)
}

export async function captureUboOwnership(
  id: string,
  body: CaptureUboBody
): Promise<UboOwnershipRecordResponse> {
  const data = await api.post(`/partners/${id}/ubo`, body)
  return UboOwnershipRecordResponseSchema.parse(data)
}

export async function fetchPartnerUbo(id: string): Promise<PartnerUboResponse> {
  const data = await api.get(`/partners/${id}/ubo`)
  return PartnerUboResponseSchema.parse(data)
}

export async function fetchConfirmationHistory(
  id: string,
  params?: { cursor?: string | null; per_page?: number }
): Promise<ConfirmationHistoryResponse> {
  const data = await api.get(`/partners/${id}/confirmation-history`, { params })
  return ConfirmationHistoryResponseSchema.parse(data)
}

export async function fetchDecisionHistory(
  id: string,
  params?: { cursor?: string | null; per_page?: number }
): Promise<DecisionHistoryResponse> {
  const data = await api.get(`/partners/${id}/decision-history`, { params })
  return DecisionHistoryResponseSchema.parse(data)
}

export async function fetchArchiveEligibility(
  id: string
): Promise<ArchiveEligibilityResponse> {
  const data = await api.get(`/partners/${id}/archive-eligibility`)
  return ArchiveEligibilityResponseSchema.parse(data)
}

export async function archivePartner(
  id: string,
  body: ArchivePartnerBody
): Promise<ArchivePartnerResponse> {
  const data = await api.post(`/partners/${id}/archive`, body)
  return ArchivePartnerResponseSchema.parse(data)
}

export async function proposeIdentityChange(
  id: string,
  body: ProposeIdentityChangeBody
): Promise<IdentityChangeProposeResponse> {
  const data = await api.post(`/partners/${id}/identity-changes`, body)
  return IdentityChangeProposeResponseSchema.parse(data)
}

export async function fetchIdentityHistory(
  id: string
): Promise<IdentityHistoryResponse> {
  const data = await api.get(`/partners/${id}/identity-changes`)
  return IdentityHistoryResponseSchema.parse(data)
}

export async function fetchIdentityChangeDetail(
  id: string,
  changeId: string
): Promise<IdentityChangeDetailResponse> {
  const data = await api.get(`/partners/${id}/identity-changes/${changeId}`)
  return IdentityChangeDetailResponseSchema.parse(data)
}

// ── Type re-exports for convenience ──────────────────────────────────────────

export type { PartnerType, PartnerStatus, PartnerRole, UboCompletenessStatus }
