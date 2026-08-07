import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { UboOwnershipRecordResponse } from "@/features/partners/api/schema"
import {
  captureUboOwnership,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { CaptureUboBody } from "@/features/partners/api/partnersApi"

export function useCaptureUboOwnership(
  partnerId: string
): UseMutationResult<UboOwnershipRecordResponse, Error, CaptureUboBody> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CaptureUboBody) => captureUboOwnership(partnerId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.ubo(partnerId),
      })
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.detail(partnerId),
      })
      // The registry row carries the UBO completeness status, so it goes stale on capture too.
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.list(),
      })
    },
  })
}
