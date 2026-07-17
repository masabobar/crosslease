import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  rejectPartner,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { RejectPartnerBody } from "@/features/partners/api/partnersApi"

export function useRejectPartner(partnerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: RejectPartnerBody) => rejectPartner(partnerId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.detail(partnerId),
      })
      void queryClient.invalidateQueries({ queryKey: ["partners", "list"] })
      void queryClient.invalidateQueries({
        queryKey: ["partners", "confirmation-history", partnerId],
      })
    },
  })
}
