import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { IdentityChangeProposeResponse } from "@/features/partners/api/schema"
import {
  proposeIdentityChange,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { ProposeIdentityChangeBody } from "@/features/partners/api/partnersApi"

export function useProposeIdentityChange(
  partnerId: string
): UseMutationResult<
  IdentityChangeProposeResponse,
  Error,
  ProposeIdentityChangeBody
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ProposeIdentityChangeBody) =>
      proposeIdentityChange(partnerId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.identityHistory(partnerId),
      })
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.detail(partnerId),
      })
    },
  })
}
