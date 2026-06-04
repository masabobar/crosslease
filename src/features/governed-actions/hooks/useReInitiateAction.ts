import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  reInitiateGovernedAction,
  GOVERNED_ACTIONS_QUERY_KEYS,
} from "@/features/governed-actions/api/governedActionsApi"

export function useReInitiateAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      reInitiateGovernedAction(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GOVERNED_ACTIONS_QUERY_KEYS.lists(),
      })
    },
  })
}
