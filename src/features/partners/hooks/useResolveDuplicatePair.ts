import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { ResolveDuplicatePairResponse } from "@/features/partners/api/schema"
import {
  resolveDuplicatePair,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { ResolveDuplicateBody } from "@/features/partners/api/partnersApi"

type ResolveDuplicatePairInput = {
  pairId: string
  body: ResolveDuplicateBody
}

export function useResolveDuplicatePair(
  tenantId: string | null
): UseMutationResult<
  ResolveDuplicatePairResponse,
  Error,
  ResolveDuplicatePairInput
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pairId, body }: ResolveDuplicatePairInput) =>
      resolveDuplicatePair(pairId, body),
    // Refetch on both success and failure: a DUPLICATE_PAIR_ALREADY_RESOLVED
    // conflict means another reviewer already changed this pair's status, so
    // the list must refresh to drop the stale resolve action.
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.duplicatePairs(tenantId),
      })
    },
  })
}
