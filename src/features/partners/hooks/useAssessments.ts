import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query"
import { FIVE_MINUTES_MS } from "@/lib/constants"
import {
  ASSESSMENT_QUERY_KEYS,
  PARTNER_ADDRESS_QUERY_KEYS,
  PARTNER_CONNECTION_QUERY_KEYS,
  PARTNER_DOCUMENT_QUERY_KEYS,
  PARTNER_RELATIONSHIP_QUERY_KEYS,
  cancelPartnerAssessment,
  createPartnerAssessment,
  fetchAssessmentCatalogue,
  fetchPartnerAssessments,
  fetchPartnerAddresses,
  fetchPartnerConnections,
  fetchPartnerDocuments,
  fetchPartnerRelationships,
  type AssessmentValueInput,
} from "@/features/partners/api/assessmentsApi"
import type {
  Assessment,
  AssessmentCatalogueResponse,
  AssessmentListResponse,
  PartnerAddressListResponse,
  PartnerConnectionsResponse,
  PartnerDocumentsResponse,
  PartnerRelationshipsResponse,
} from "@/features/partners/api/assessmentSchema"

export function useAssessmentCatalogue(): UseQueryResult<
  AssessmentCatalogueResponse,
  Error
> {
  return useQuery({
    queryKey: ASSESSMENT_QUERY_KEYS.catalogue,
    queryFn: fetchAssessmentCatalogue,
    // Tenant configuration, not case data — it does not change while a form is open.
    staleTime: FIVE_MINUTES_MS,
  })
}

export function usePartnerAssessments(
  partnerId: string | undefined
): UseQueryResult<AssessmentListResponse, Error> {
  return useQuery({
    queryKey: ASSESSMENT_QUERY_KEYS.list(partnerId ?? ""),
    queryFn: () => fetchPartnerAssessments(partnerId as string),
    enabled: Boolean(partnerId),
  })
}

export function usePartnerConnections(
  partnerId: string | undefined
): UseQueryResult<PartnerConnectionsResponse, Error> {
  return useQuery({
    queryKey: PARTNER_CONNECTION_QUERY_KEYS.list(partnerId ?? ""),
    queryFn: () => fetchPartnerConnections(partnerId as string),
    enabled: Boolean(partnerId),
  })
}

export function usePartnerRelationships(
  partnerId: string | undefined
): UseQueryResult<PartnerRelationshipsResponse, Error> {
  return useQuery({
    queryKey: PARTNER_RELATIONSHIP_QUERY_KEYS.list(partnerId ?? ""),
    queryFn: () => fetchPartnerRelationships(partnerId as string),
    enabled: Boolean(partnerId),
  })
}

export function usePartnerDocuments(
  partnerId: string | undefined
): UseQueryResult<PartnerDocumentsResponse, Error> {
  return useQuery({
    queryKey: PARTNER_DOCUMENT_QUERY_KEYS.list(partnerId ?? ""),
    queryFn: () => fetchPartnerDocuments(partnerId as string),
    enabled: Boolean(partnerId),
  })
}

export function usePartnerAddresses(
  partnerId: string | undefined
): UseQueryResult<PartnerAddressListResponse, Error> {
  return useQuery({
    queryKey: PARTNER_ADDRESS_QUERY_KEYS.list(partnerId ?? ""),
    queryFn: () => fetchPartnerAddresses(partnerId as string),
    enabled: Boolean(partnerId),
  })
}

export function useCreateAssessment(): UseMutationResult<
  Assessment,
  Error,
  {
    partnerId: string
    source_type_id: string
    report_date: string
    source_reference?: string | null
    context_note?: string | null
    values: AssessmentValueInput[]
  }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ partnerId, ...body }) =>
      createPartnerAssessment(partnerId, body),
    onSuccess: (_created, { partnerId }) => {
      void queryClient.invalidateQueries({
        queryKey: ASSESSMENT_QUERY_KEYS.list(partnerId),
      })
    },
  })
}

export function useCancelAssessment(): UseMutationResult<
  Assessment,
  Error,
  { partnerId: string; assessmentId: string; reason: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ partnerId, assessmentId, reason }) =>
      cancelPartnerAssessment(partnerId, assessmentId, reason),
    onSuccess: (_updated, { partnerId }) => {
      void queryClient.invalidateQueries({
        queryKey: ASSESSMENT_QUERY_KEYS.list(partnerId),
      })
    },
  })
}
