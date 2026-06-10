import { useMutation, useQueryClient } from "@tanstack/react-query"
import { GOVERNED_ACTIONS_QUERY_KEYS } from "@/features/governed-actions/api/governedActionsApi"

export function createGovernedActionMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>
) {
  return function () {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn,
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: GOVERNED_ACTIONS_QUERY_KEYS.lists(),
        })
      },
    })
  }
}
