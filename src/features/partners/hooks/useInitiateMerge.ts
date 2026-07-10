import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  initiateMerge,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { InitiateMergeBody } from "@/features/partners/api/partnersApi"

export function useInitiateMerge(tenantId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: InitiateMergeBody) => initiateMerge(body),
    // Refetch on both success and failure: a PAIR_NOT_FLAGGED_FOR_MERGE error
    // means the pair's status changed since the page loaded, so the list must
    // refresh to reflect the current state.
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.duplicatePairs(tenantId),
      })
    },
  })
}
