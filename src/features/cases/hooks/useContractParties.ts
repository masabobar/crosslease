import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  addContractGuarantor,
  captureContractLessee,
  fetchContractGuarantors,
  fetchContractLessee,
  removeContractGuarantor,
} from "@/features/cases/api/casesApi"
import type {
  GuarantorLinkResponse,
  GuarantorListResponse,
  LesseeLinkResponse,
} from "@/features/cases/api/schema"

// The lessee linked to a contract (US 1.6). `null` until one is captured.
export function useContractLessee(contractId: string | undefined) {
  return useQuery<LesseeLinkResponse | null>({
    queryKey: CASE_QUERY_KEYS.contractLessee(contractId ?? ""),
    queryFn: () => fetchContractLessee(contractId as string),
    enabled: Boolean(contractId),
  })
}

export function useCaptureLessee(): UseMutationResult<
  LesseeLinkResponse,
  Error,
  { contractId: string; partnerId: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, partnerId }) =>
      captureContractLessee(contractId, partnerId),
    onSuccess: (_link, { contractId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractLessee(contractId),
      })
    },
  })
}

// Guarantors and co-obligors on a contract (US 1.7).
export function useContractGuarantors(contractId: string | undefined) {
  return useQuery<GuarantorListResponse>({
    queryKey: CASE_QUERY_KEYS.contractGuarantors(contractId ?? ""),
    queryFn: () => fetchContractGuarantors(contractId as string),
    enabled: Boolean(contractId),
  })
}

export function useAddGuarantor(): UseMutationResult<
  GuarantorLinkResponse,
  Error,
  { contractId: string; partnerId: string; kindOfObligation: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, partnerId, kindOfObligation }) =>
      addContractGuarantor(contractId, partnerId, kindOfObligation),
    onSuccess: (_link, { contractId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractGuarantors(contractId),
      })
    },
  })
}

// Unlinks a guarantor. The partner itself is untouched — it is a link that is removed, which is why
// the endpoint is a POST to /remove rather than a DELETE on the partner.
export function useRemoveGuarantor(): UseMutationResult<
  void,
  Error,
  { contractId: string; linkId: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, linkId }) =>
      removeContractGuarantor(contractId, linkId),
    onSuccess: (_void, { contractId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractGuarantors(contractId),
      })
    },
  })
}
