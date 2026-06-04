import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  rejectGovernedAction,
  GOVERNED_ACTIONS_QUERY_KEYS,
} from "@/features/governed-actions/api/governedActionsApi"

export function useRejectAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      rejectGovernedAction(id, comment),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GOVERNED_ACTIONS_QUERY_KEYS.lists(),
      })
    },
  })
}
