import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  resolveDuplicatePair,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { ResolveDuplicateBody } from "@/features/partners/api/partnersApi"

export function useResolveDuplicatePair(tenantId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pairId,
      body,
    }: {
      pairId: string
      body: ResolveDuplicateBody
    }) => resolveDuplicatePair(pairId, body),
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
