import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  withdrawGovernedAction,
  GOVERNED_ACTIONS_QUERY_KEYS,
} from "@/features/governed-actions/api/governedActionsApi"

export function useWithdrawAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string }) => withdrawGovernedAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GOVERNED_ACTIONS_QUERY_KEYS.lists(),
      })
    },
  })
}
