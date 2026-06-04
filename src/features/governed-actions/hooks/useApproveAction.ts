import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  approveGovernedAction,
  GOVERNED_ACTIONS_QUERY_KEYS,
} from "@/features/governed-actions/api/governedActionsApi"

export function useApproveAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approveGovernedAction(id, comment),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GOVERNED_ACTIONS_QUERY_KEYS.lists(),
      })
    },
  })
}
