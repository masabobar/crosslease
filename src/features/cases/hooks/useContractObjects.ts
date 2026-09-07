import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  createContractObject,
  fetchContractObjects,
  fetchObjectClassification,
  updateContractObject,
} from "@/features/cases/api/casesApi"
import { FIVE_MINUTES_MS } from "@/lib/constants"
import type {
  LeaseObjectListResponse,
  LeaseObjectRead,
  ObjectClassificationResponse,
} from "@/features/cases/api/schema"

/**
 * The object group / sub-group tree the manual-entry form picks from.
 *
 * Bank-wide configuration rather than case data, and it changes about as often as the bank's
 * product catalogue — so it is cached rather than re-fetched every time the modal opens.
 */
export function useObjectClassification() {
  return useQuery<ObjectClassificationResponse>({
    queryKey: CASE_QUERY_KEYS.objectClassification,
    queryFn: fetchObjectClassification,
    staleTime: FIVE_MINUTES_MS,
  })
}

export function useContractObjects(contractId: string | undefined) {
  return useQuery<LeaseObjectListResponse>({
    queryKey: CASE_QUERY_KEYS.contractObjects(contractId ?? ""),
    queryFn: () => fetchContractObjects(contractId as string),
    enabled: Boolean(contractId),
  })
}

export function useCreateContractObject(): UseMutationResult<
  LeaseObjectRead,
  Error,
  { contractId: string; body: Record<string, unknown> }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, body }) =>
      createContractObject(contractId, body),
    onSuccess: (_object, { contractId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractObjects(contractId),
      })
    },
  })
}

export function useUpdateContractObject(): UseMutationResult<
  LeaseObjectRead,
  Error,
  { contractId: string; objectId: string; body: Record<string, unknown> }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ objectId, body }) => updateContractObject(objectId, body),
    // Invalidated by contract, not by object: the list is what the form renders, and an edited
    // object's own cache entry is never read on its own.
    onSuccess: (_object, { contractId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractObjects(contractId),
      })
    },
  })
}
