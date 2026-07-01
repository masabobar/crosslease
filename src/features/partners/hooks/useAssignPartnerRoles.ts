import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  assignPartnerRoles,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { AssignRolesBody } from "@/features/partners/api/partnersApi"

export function useAssignPartnerRoles(partnerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AssignRolesBody) => assignPartnerRoles(partnerId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PARTNERS_QUERY_KEYS.roles(partnerId),
      })
    },
  })
}
