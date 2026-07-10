import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  captureUboOwnership,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { CaptureUboBody } from "@/features/partners/api/partnersApi"

export function useCaptureUboOwnership(partnerId: string) {
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
    },
  })
}
