import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { ArchivePartnerResponse } from "@/features/partners/api/schema"
import {
  archivePartner,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { ArchivePartnerBody } from "@/features/partners/api/partnersApi"

export function useArchivePartner(
  partnerId: string
): UseMutationResult<ArchivePartnerResponse, Error, ArchivePartnerBody> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ArchivePartnerBody) => archivePartner(partnerId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.detail(partnerId),
      })
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.list(),
      })
    },
  })
}
