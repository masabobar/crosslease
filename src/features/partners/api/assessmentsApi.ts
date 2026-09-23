import { api } from "@/lib/api"
import {
  AssessmentCatalogueResponseSchema,
  AssessmentListResponseSchema,
  AssessmentSchema,
  PartnerAddressListResponseSchema,
  PartnerConnectionsResponseSchema,
  PartnerDocumentsResponseSchema,
  PartnerRelationshipsResponseSchema,
} from "@/features/partners/api/assessmentSchema"
import type {
  Assessment,
  AssessmentCatalogueResponse,
  AssessmentListResponse,
  PartnerAddressListResponse,
  PartnerConnectionsResponse,
  PartnerDocumentsResponse,
  PartnerRelationshipsResponse,
} from "@/features/partners/api/assessmentSchema"

export const PARTNER_CONNECTION_QUERY_KEYS = {
  list: (partnerId: string) => ["partners", "connections", partnerId] as const,
}

export async function fetchPartnerConnections(
  partnerId: string
): Promise<PartnerConnectionsResponse> {
  const data = await api.get(`/partners/${partnerId}/connections`)
  return PartnerConnectionsResponseSchema.parse(data)
}

export const PARTNER_RELATIONSHIP_QUERY_KEYS = {
  list: (partnerId: string) =>
    ["partners", "relationships", partnerId] as const,
}

export async function fetchPartnerRelationships(
  partnerId: string
): Promise<PartnerRelationshipsResponse> {
  const data = await api.get(`/partners/${partnerId}/relationships`)
  return PartnerRelationshipsResponseSchema.parse(data)
}

export const PARTNER_DOCUMENT_QUERY_KEYS = {
  list: (partnerId: string) => ["partners", "documents", partnerId] as const,
}

export async function fetchPartnerDocuments(
  partnerId: string
): Promise<PartnerDocumentsResponse> {
  const data = await api.get(`/partners/${partnerId}/documents`)
  return PartnerDocumentsResponseSchema.parse(data)
}

export const PARTNER_ADDRESS_QUERY_KEYS = {
  list: (partnerId: string) => ["partners", "addresses", partnerId] as const,
}

export async function fetchPartnerAddresses(
  partnerId: string
): Promise<PartnerAddressListResponse> {
  const data = await api.get(`/partners/${partnerId}/addresses`)
  return PartnerAddressListResponseSchema.parse(data)
}

export const ASSESSMENT_QUERY_KEYS = {
  // Tenant-wide and rarely changing — the same catalogue backs every partner's form.
  catalogue: ["partners", "assessment-catalogue"] as const,
  list: (partnerId: string) => ["partners", "assessments", partnerId] as const,
}

export async function fetchAssessmentCatalogue(): Promise<AssessmentCatalogueResponse> {
  const data = await api.get("/partners/assessment-catalogue")
  return AssessmentCatalogueResponseSchema.parse(data)
}

export async function fetchPartnerAssessments(
  partnerId: string
): Promise<AssessmentListResponse> {
  const data = await api.get(`/partners/${partnerId}/assessments`)
  return AssessmentListResponseSchema.parse(data)
}

export type AssessmentValueInput = {
  attribute_id: string
  value_number?: string | null
  value_text?: string | null
  no_value_supplied: boolean
}

export async function createPartnerAssessment(
  partnerId: string,
  body: {
    source_type_id: string
    report_date: string
    source_reference?: string | null
    context_note?: string | null
    values: AssessmentValueInput[]
  }
): Promise<Assessment> {
  const data = await api.post(`/partners/${partnerId}/assessments`, body)
  return AssessmentSchema.parse(data)
}

/**
 * Cancel one, with a reason.
 *
 * Not a delete: an assessment that informed a decision has to stay readable, so the record keeps
 * it and marks it — which is why the list renders cancelled rows struck through rather than
 * dropping them.
 */
export async function cancelPartnerAssessment(
  partnerId: string,
  assessmentId: string,
  reason: string
): Promise<Assessment> {
  const data = await api.post(
    `/partners/${partnerId}/assessments/${assessmentId}/cancel`,
    { reason }
  )
  return AssessmentSchema.parse(data)
}
