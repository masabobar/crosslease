import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { PartnerDetailResponse } from "@/features/partners/api/schema"
import {
  confirmPartner,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { ConfirmPartnerBody } from "@/features/partners/api/partnersApi"

export function useConfirmPartner(
  partnerId: string
): UseMutationResult<PartnerDetailResponse, Error, ConfirmPartnerBody> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ConfirmPartnerBody) => confirmPartner(partnerId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.detail(partnerId),
      })
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.list(),
      })
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.confirmationHistory(partnerId),
      })
    },
  })
}
